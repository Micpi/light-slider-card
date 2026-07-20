/**
 * Light Slider Card - Custom Home Assistant Lovelace Card
 * Bargraphe luminosité + bouton power intégré
 */

/* ──────────────────────────────────────────────
 *  ÉDITEUR VISUEL (GUI Config)
 * ────────────────────────────────────────────── */
class LightSliderCardEditor extends HTMLElement {
  constructor() {
    super()
    this._config = {}
    this._hass = null
  }

  set hass(hass) {
    this._hass = hass
    if (!this._built) {
      this._buildUI()
    } else {
      this.querySelectorAll("ha-form").forEach((f) => {
        f.hass = hass
      })
    }
  }

  setConfig(config) {
    const oldEntCount = (this._config.entities || []).length
    this._config = { ...config }
    const newEntCount = (
      this._config.entities || (this._config.entity ? [this._config.entity] : [])
    ).length
    if (!this._built || oldEntCount !== newEntCount) {
      this._built = false
      if (this._hass) this._buildUI()
    }
  }

  _fire() {
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: { ...this._config } },
        bubbles: true,
        composed: true,
      })
    )
  }

  _getEntities() {
    const raw = this._config.entities || (this._config.entity ? [this._config.entity] : [])
    return raw.map((e) =>
      typeof e === "object" && e !== null
        ? {
            entity: e.entity || "",
            name: e.name || "",
            icon: e.icon || "",
            mode: e.mode || "dimmer",
          }
        : { entity: e || "", name: "", icon: "", mode: "dimmer" }
    )
  }

  _setEntities(arr) {
    const cleaned = arr.map((e) => {
      if (e.name || e.icon || (e.mode && e.mode !== "dimmer")) {
        const obj = { entity: e.entity }
        if (e.name) obj.name = e.name
        if (e.icon) obj.icon = e.icon
        if (e.mode && e.mode !== "dimmer") obj.mode = e.mode
        return obj
      }
      return e.entity
    })
    this._config = { ...this._config, entities: cleaned }
    delete this._config.entity
  }

  _buildUI() {
    if (!this._hass) return

    this.innerHTML = ""

    const style = document.createElement("style")
    style.textContent = `
            .lsc-editor { display: flex; flex-direction: column; gap: 12px; }
            .lsc-section { font-size: 12px; font-weight: 500; color: var(--secondary-text-color);
                text-transform: uppercase; letter-spacing: 1px; margin: 8px 0 2px; }
            .lsc-entity-card {
                background: var(--card-background-color, rgba(255,255,255,0.04));
                border: 1px solid var(--divider-color, rgba(127,127,127,0.2));
                border-radius: 12px; position: relative;
                overflow: hidden;
            }
            .lsc-entity-summary {
                display: flex; align-items: center; justify-content: space-between;
                padding: 12px; cursor: pointer; user-select: none;
            }
            .lsc-entity-summary:hover { background: rgba(255,255,255,0.03); }
            .lsc-entity-summary-label {
                font-size: 14px; font-weight: 500;
                color: var(--primary-text-color); overflow: hidden;
                text-overflow: ellipsis; white-space: nowrap; flex: 1;
            }
            .lsc-entity-summary-actions { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }
            .lsc-entity-summary-actions ha-icon {
                --mdc-icon-size: 18px; color: var(--secondary-text-color);
                transition: transform 0.2s ease;
            }
            .lsc-entity-summary-actions ha-icon.expanded { transform: rotate(180deg); }
            .lsc-entity-body {
                max-height: 0; overflow: hidden;
                transition: max-height 0.25s ease, padding 0.25s ease;
                padding: 0 12px;
            }
            .lsc-entity-body.open {
                max-height: 300px; padding: 0 12px 12px;
            }
            .lsc-remove-btn {
                cursor: pointer; color: var(--error-color, #db4437); background: none;
                border: none; padding: 4px; border-radius: 50%; display: flex;
            }
            .lsc-remove-btn:hover { background: rgba(219,68,55,0.1); }
            .lsc-remove-btn ha-icon { --mdc-icon-size: 20px; }
            .lsc-add-btn {
                display: flex; align-items: center; gap: 8px; cursor: pointer;
                color: var(--primary-color); font-size: 14px; font-weight: 500;
                border: 1px dashed var(--divider-color, rgba(127,127,127,0.3));
                border-radius: 12px; padding: 12px 16px; background: none; width: 100%;
                box-sizing: border-box;
            }
            .lsc-add-btn:hover { background: rgba(var(--rgb-primary-color,3,169,244),0.06); }
            .lsc-add-btn ha-icon { --mdc-icon-size: 18px; }
        `
    this.appendChild(style)

    const editor = document.createElement("div")
    editor.className = "lsc-editor"
    this.appendChild(editor)

    // ── Entities section ──
    const entLabel = document.createElement("div")
    entLabel.className = "lsc-section"
    entLabel.textContent = "Lumières"
    editor.appendChild(entLabel)

    const entities = this._getEntities()
    const entitySchema = [
      { name: "entity", selector: { entity: { filter: { domain: "light" } } } },
      {
        name: "",
        type: "grid",
        flatten: true,
        schema: [
          { name: "name", selector: { text: {} } },
          { name: "icon", selector: { icon: {} } },
        ],
      },
      {
        name: "mode",
        selector: {
          select: {
            options: [
              { value: "dimmer", label: "Variation (dimmer)" },
              { value: "toggle", label: "On / Off uniquement" },
            ],
          },
        },
      },
    ]
    const entityLabels = { entity: "Entité", name: "Nom personnalisé", icon: "Icône", mode: "Mode" }
    const entityDescriptions = {
      name: "Vide = nom de l'entité",
      icon: "Vide = icône de l'entité",
      mode: "",
    }

    entities.forEach((ent, idx) => {
      const card = document.createElement("div")
      card.className = "lsc-entity-card"

      // Collapsible summary
      const summary = document.createElement("div")
      summary.className = "lsc-entity-summary"
      const label = document.createElement("span")
      label.className = "lsc-entity-summary-label"
      const entState = ent.entity ? this._hass.states[ent.entity] : null
      label.textContent =
        ent.name ||
        (entState && entState.attributes.friendly_name) ||
        ent.entity ||
        "Nouvelle lumière"
      summary.appendChild(label)

      const actions = document.createElement("span")
      actions.className = "lsc-entity-summary-actions"

      const removeBtn = document.createElement("button")
      removeBtn.className = "lsc-remove-btn"
      removeBtn.title = "Supprimer"
      removeBtn.innerHTML = '<ha-icon icon="mdi:close-circle"></ha-icon>'
      removeBtn.addEventListener("click", (ev) => {
        ev.stopPropagation()
        const ents = this._getEntities()
        ents.splice(idx, 1)
        this._setEntities(ents)
        this._fire()
        this._buildUI()
      })
      actions.appendChild(removeBtn)

      const chevron = document.createElement("ha-icon")
      chevron.icon = "mdi:chevron-down"
      actions.appendChild(chevron)

      summary.appendChild(actions)
      card.appendChild(summary)

      // Collapsible body
      const body = document.createElement("div")
      body.className = "lsc-entity-body"

      summary.addEventListener("click", () => {
        const open = body.classList.toggle("open")
        chevron.classList.toggle("expanded", open)
      })

      const form = document.createElement("ha-form")
      form.hass = this._hass
      form.data = { entity: ent.entity, name: ent.name, icon: ent.icon, mode: ent.mode || "dimmer" }
      form.schema = entitySchema
      form.computeLabel = (s) => entityLabels[s.name] || s.name
      form.computeHelper = (s) => entityDescriptions[s.name] || ""
      form.addEventListener("value-changed", (ev) => {
        ev.stopPropagation()
        const d = ev.detail.value
        const ents = this._getEntities()
        ents[idx] = {
          entity: d.entity || "",
          name: d.name || "",
          icon: d.icon || "",
          mode: d.mode || "dimmer",
        }
        this._setEntities(ents)
        this._fire()
        // Update summary label
        const entSt = d.entity ? this._hass.states[d.entity] : null
        label.textContent =
          d.name || (entSt && entSt.attributes.friendly_name) || d.entity || "Nouvelle lumière"
      })

      body.appendChild(form)
      card.appendChild(body)

      // Auto-open if entity is empty (new entry)
      if (!ent.entity) {
        body.classList.add("open")
        chevron.classList.add("expanded")
      }

      editor.appendChild(card)
    })

    // Add button
    const addBtn = document.createElement("button")
    addBtn.className = "lsc-add-btn"
    addBtn.innerHTML = '<ha-icon icon="mdi:plus"></ha-icon> Ajouter une lumière'
    addBtn.addEventListener("click", () => {
      const ents = this._getEntities()
      ents.push({ entity: "", name: "", icon: "", mode: "dimmer" })
      this._setEntities(ents)
      this._fire()
      this._buildUI()
    })
    editor.appendChild(addBtn)

    // ── Appearance section ──
    const appLabel = document.createElement("div")
    appLabel.className = "lsc-section"
    appLabel.textContent = "Apparence"
    editor.appendChild(appLabel)

    const appForm = document.createElement("ha-form")
    appForm.hass = this._hass
    appForm.data = {
      title: this._config.title || "",
      height: this._config.height || 48,
      border_radius: this._config.border_radius || 14,
      background_style:
        this._config.background_style || (this._config.card_background ? "custom" : "default"),
      background_blur:
        this._config.background_blur !== undefined ? this._config.background_blur : 18,
      card_background:
        this._config.card_background ||
        "var(--ha-card-background, var(--card-background-color, #1c1c1e))",
      show_frame: this._config.show_frame !== false,
      bar_color: this._config.bar_color || "",
      bar_color_off: this._config.bar_color_off || "",
      bar_opacity: this._config.bar_opacity !== undefined ? this._config.bar_opacity : 0.85,
      icon_size: this._config.icon_size || "24px",
      show_percentage: this._config.show_percentage !== false,
      live_update: this._config.live_update || false,
      label_position: this._config.label_position || "above",
      slider_gap: this._config.slider_gap !== undefined ? this._config.slider_gap : 14,
      slider_padding: this._config.slider_padding !== undefined ? this._config.slider_padding : 16,
      compact_mobile: this._config.compact_mobile !== false,
      compact_breakpoint:
        this._config.compact_breakpoint !== undefined ? this._config.compact_breakpoint : 560,
      mobile_height: this._config.mobile_height !== undefined ? this._config.mobile_height : 40,
      mobile_slider_gap:
        this._config.mobile_slider_gap !== undefined ? this._config.mobile_slider_gap : 10,
      mobile_slider_padding:
        this._config.mobile_slider_padding !== undefined ? this._config.mobile_slider_padding : 12,
      mobile_icon_size: this._config.mobile_icon_size || "21px",
    }
    const appDescriptions = {
      title: "",
      height: "Défaut : 48 px",
      border_radius: "Défaut : 14 px",
      background_style:
        "Choisissez un rendu de fond prêt à l'emploi ou utilisez un fond CSS personnalisé",
      background_blur: "Défaut : 18 px (utilisé pour Blur et Glass)",
      card_background: "Utilisé uniquement si le mode est Personnalisé",
      bar_color: "Défaut : linear-gradient(90deg, #ff9800, #ffcc02)",
      bar_color_off: "Défaut : #3a3a3a",
      bar_opacity: "Défaut : 0.85 (0 = transparent, 1 = opaque)",
      icon_size: "Défaut : 24px",
      show_percentage: "",
      live_update: "Envoie la luminosité pendant le glissement",
      label_position: "",
      slider_gap: "Défaut : 14 px",
      slider_padding: "Défaut : 16 px",
      compact_mobile: "Active le mode compact sur petit écran",
      compact_breakpoint: "Largeur max (px) où le mode compact s'applique",
      mobile_height: "Hauteur du slider en mode compact",
      mobile_slider_gap: "Espacement entre sliders en mode compact",
      mobile_slider_padding: "Marge gauche / droite en mode compact",
      mobile_icon_size: "Taille icône en mode compact (ex: 21px)",
      show_frame: "Afficher le cadre de la carte",
    }
    appForm.schema = [
      { name: "title", selector: { text: {} } },
      {
        name: "",
        type: "grid",
        flatten: true,
        schema: [
          {
            name: "height",
            selector: {
              number: { min: 20, max: 100, step: 2, unit_of_measurement: "px", mode: "slider" },
            },
          },
          {
            name: "border_radius",
            selector: {
              number: { min: 0, max: 40, step: 1, unit_of_measurement: "px", mode: "slider" },
            },
          },
        ],
      },
      {
        name: "background_style",
        selector: {
          select: {
            options: [
              { value: "default", label: "Standard" },
              { value: "transparent", label: "Transparent" },
              { value: "gradient", label: "Dégradé" },
              { value: "blur", label: "Flou" },
              { value: "glass", label: "Glassmorphism" },
              { value: "custom", label: "Personnalisé (CSS)" },
            ],
          },
        },
      },
      {
        name: "background_blur",
        selector: {
          number: { min: 0, max: 60, step: 1, unit_of_measurement: "px", mode: "slider" },
        },
      },
      { name: "card_background", selector: { text: {} } },
      { name: "show_frame", selector: { boolean: {} } },
      {
        name: "",
        type: "grid",
        flatten: true,
        schema: [
          { name: "bar_color", selector: { text: {} } },
          { name: "bar_color_off", selector: { text: {} } },
        ],
      },
      { name: "bar_opacity", selector: { number: { min: 0, max: 1, step: 0.05, mode: "slider" } } },
      { name: "icon_size", selector: { text: {} } },
      { name: "show_percentage", selector: { boolean: {} } },
      { name: "live_update", selector: { boolean: {} } },
      {
        name: "label_position",
        selector: {
          select: {
            options: [
              { value: "above", label: "Au-dessus de la barre" },
              { value: "inside", label: "Dans la barre" },
            ],
          },
        },
      },
      {
        name: "slider_gap",
        selector: {
          number: { min: 0, max: 40, step: 2, unit_of_measurement: "px", mode: "slider" },
        },
      },
      {
        name: "slider_padding",
        selector: {
          number: { min: 0, max: 40, step: 2, unit_of_measurement: "px", mode: "slider" },
        },
      },
      { name: "compact_mobile", selector: { boolean: {} } },
      {
        name: "compact_breakpoint",
        selector: {
          number: { min: 320, max: 1024, step: 10, unit_of_measurement: "px", mode: "slider" },
        },
      },
      {
        name: "",
        type: "grid",
        flatten: true,
        schema: [
          {
            name: "mobile_height",
            selector: {
              number: { min: 28, max: 80, step: 2, unit_of_measurement: "px", mode: "slider" },
            },
          },
          { name: "mobile_icon_size", selector: { text: {} } },
        ],
      },
      {
        name: "",
        type: "grid",
        flatten: true,
        schema: [
          {
            name: "mobile_slider_gap",
            selector: {
              number: { min: 0, max: 30, step: 2, unit_of_measurement: "px", mode: "slider" },
            },
          },
          {
            name: "mobile_slider_padding",
            selector: {
              number: { min: 0, max: 30, step: 2, unit_of_measurement: "px", mode: "slider" },
            },
          },
        ],
      },
    ]
    const appLabels = {
      title: "Titre de la carte",
      height: "Hauteur du slider",
      border_radius: "Arrondi des coins",
      background_style: "Mode de fond",
      background_blur: "Flou du fond",
      card_background: "Fond personnalisé CSS",
      show_frame: "Afficher le cadre",
      bar_color: "Couleur barre ON (CSS)",
      bar_color_off: "Couleur barre OFF",
      bar_opacity: "Opacité barre ON",
      icon_size: "Taille de l'icône",
      show_percentage: "Afficher le pourcentage",
      live_update: "Mise à jour en direct",
      label_position: "Position du nom / pourcentage",
      slider_gap: "Espacement entre les sliders",
      slider_padding: "Marge gauche / droite du slider",
      compact_mobile: "Mode compact mobile",
      compact_breakpoint: "Seuil mobile (px)",
      mobile_height: "Hauteur slider mobile",
      mobile_slider_gap: "Espacement mobile",
      mobile_slider_padding: "Marge latérale mobile",
      mobile_icon_size: "Taille icône mobile",
    }
    appForm.computeLabel = (s) => appLabels[s.name] || s.name
    appForm.computeHelper = (s) => appDescriptions[s.name] || ""
    appForm.addEventListener("value-changed", (ev) => {
      ev.stopPropagation()
      const d = ev.detail.value
      const updated = { ...this._config }
      for (const [k, v] of Object.entries(d)) {
        if (v === "" || v === undefined) delete updated[k]
        else updated[k] = v
      }
      if (updated.background_style !== "custom") {
        delete updated.card_background
      } else if (!updated.card_background) {
        updated.card_background = "var(--ha-card-background, var(--card-background-color, #1c1c1e))"
      }
      this._config = updated
      this._fire()
    })
    editor.appendChild(appForm)

    this._built = true
  }
}

customElements.define("light-slider-card-editor", LightSliderCardEditor)
class LightSliderCard extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: "open" })
    this._isDragging = false
    this._rowRefs = []
    this._allPowerBtn = null
    this._lastEntityStates = new Map()
  }

  set hass(hass) {
    this._hass = hass
    if (!this._config) return
    if (this._isDragging) return
    if (!this._needsFullRender && this._rendered && !this._hasRelevantStateChanges()) return
    this._render()
  }

  setConfig(config) {
    if (!config.entities && !config.entity) {
      throw new Error("Vous devez définir 'entity' ou 'entities'")
    }
    const baseHeight = config.height || 48
    const baseGap = config.slider_gap !== undefined ? config.slider_gap : 14
    const basePadding = config.slider_padding !== undefined ? config.slider_padding : 16
    const baseIconSize = config.icon_size || "24px"
    const parsedIconSize = Number.parseFloat(baseIconSize)
    const iconUnit = baseIconSize.replace(String(parsedIconSize), "") || "px"
    const mobileIconSize = Number.isFinite(parsedIconSize)
      ? `${Math.max(16, parsedIconSize - 3)}${iconUnit}`
      : baseIconSize
    const backgroundStyle =
      config.background_style || (config.card_background ? "custom" : "default")

    this._config = {
      title: config.title || "",
      entities: config.entities || [config.entity],
      bar_color: config.bar_color || "linear-gradient(90deg, #ff9800, #ffcc02)",
      bar_color_off: config.bar_color_off || "#3a3a3a",
      bar_opacity: config.bar_opacity !== undefined ? config.bar_opacity : 0.85,
      icon_size: baseIconSize,
      height: baseHeight,
      border_radius: config.border_radius || 14,
      slider_gap: baseGap,
      slider_padding: basePadding,
      show_percentage: config.show_percentage !== false,
      live_update: config.live_update || false,
      label_position: config.label_position || "above",
      background_style: backgroundStyle,
      card_background:
        config.card_background ||
        "var(--ha-card-background, var(--card-background-color, #1c1c1e))",
      background_blur: config.background_blur !== undefined ? config.background_blur : 18,
      show_frame: config.show_frame !== false,
      compact_mobile: config.compact_mobile !== false,
      compact_breakpoint: config.compact_breakpoint || 560,
      mobile_height: config.mobile_height || Math.max(36, baseHeight - 8),
      mobile_slider_gap: config.mobile_slider_gap || Math.max(8, baseGap - 4),
      mobile_slider_padding: config.mobile_slider_padding || Math.max(8, basePadding - 4),
      mobile_icon_size: config.mobile_icon_size || mobileIconSize,
    }
    this._needsFullRender = true
    this._lastEntityStates.clear()
    this._render()
  }

  _hasRelevantStateChanges() {
    const entities = this._config?.entities || []
    for (const entry of entities) {
      const { entityId } = this._parseEntity(entry)
      if (this._hass.states[entityId] !== this._lastEntityStates.get(entityId)) {
        return true
      }
    }
    return false
  }

  _syncStateCache() {
    this._lastEntityStates.clear()
    this._config.entities.forEach((entry) => {
      const { entityId } = this._parseEntity(entry)
      this._lastEntityStates.set(entityId, this._hass.states[entityId])
    })
  }

  _cacheRowRefs() {
    this._allPowerBtn = this.shadowRoot.querySelector(".all-power-btn")
    this._rowRefs = this._config.entities.map((_, idx) => {
      const row = this.shadowRoot.querySelector(`.light-row[data-idx="${idx}"]`)
      if (!row) return null
      const track = row.querySelector(".bar-track")
      const iconDiv = row.querySelector(".light-icon")
      return {
        row,
        track,
        fill: row.querySelector(".bar-fill"),
        nameEl: row.querySelector(".light-name, .bar-label-name"),
        pctEl: row.querySelector(".light-pct, .bar-label-pct"),
        iconDiv,
        iconEl: iconDiv ? iconDiv.querySelector("ha-icon") : null,
        powerBtn: row.querySelector(".power-btn"),
      }
    })
  }

  _getEntityIds() {
    return (this._config?.entities || [])
      .map((entry) => this._parseEntity(entry).entityId)
      .filter(Boolean)
  }

  _getAvailableEntityIds() {
    return this._getEntityIds().filter((entityId) => this._hass?.states?.[entityId])
  }

  _hasAnyLightOn(entityIds = this._getAvailableEntityIds()) {
    return entityIds.some((entityId) => this._hass?.states?.[entityId]?.state === "on")
  }

  /** Parse entity entry: supports string or {entity, name, icon} object */
  _parseEntity(entry) {
    if (typeof entry === "object" && entry !== null) {
      return {
        entityId: entry.entity,
        customName: entry.name || null,
        customIcon: entry.icon || null,
        mode: entry.mode || "dimmer",
      }
    }
    return { entityId: entry, customName: null, customIcon: null, mode: "dimmer" }
  }

  _esc(s) {
    const d = document.createElement("span")
    d.textContent = s
    return d.innerHTML
  }

  _resolveCardBackground() {
    const defaultBackground = "var(--ha-card-background, var(--card-background-color, #1c1c1e))"
    const blurAmount = Number.isFinite(Number(this._config.background_blur))
      ? Number(this._config.background_blur)
      : 18
    const style =
      this._config.background_style || (this._config.card_background ? "custom" : "default")

    switch (style) {
      case "transparent":
        return { background: "transparent" }
      case "gradient":
        return {
          background: "linear-gradient(145deg, rgba(255,255,255,0.10), rgba(255,255,255,0.03))",
        }
      case "blur":
        return {
          background: "rgba(16, 24, 39, 0.52)",
          backdropFilter: `blur(${blurAmount}px) saturate(130%)`,
        }
      case "glass":
        return {
          background: "linear-gradient(145deg, rgba(255,255,255,0.12), rgba(255,255,255,0.04))",
          backdropFilter: `blur(${blurAmount}px) saturate(145%)`,
        }
      case "custom":
        return {
          background: this._config.card_background || defaultBackground,
        }
      case "default":
      default:
        return { background: defaultBackground }
    }
  }

  /** Mise à jour légère (pas de reconstruction DOM) */
  _update() {
    this._config.entities.forEach((entry, idx) => {
      const { entityId, customName, customIcon, mode } = this._parseEntity(entry)
      const stateObj = this._hass.states[entityId]
      const refs = this._rowRefs[idx]
      if (!refs || !stateObj) return
      const isOn = stateObj.state === "on"
      const brightness = stateObj.attributes.brightness || 0
      const pct =
        mode === "toggle" ? (isOn ? 100 : 0) : isOn ? Math.round((brightness / 255) * 100) : 0
      const name = customName || stateObj.attributes.friendly_name || entityId
      const icon = customIcon || stateObj.attributes.icon || "mdi:lightbulb"
      const stateText = mode === "toggle" ? (isOn ? "On" : "Off") : isOn ? pct + "%" : "Off"
      const fill = refs.fill
      if (fill) {
        fill.style.setProperty("--lsc-fill-ratio", `${pct / 100}`)
        fill.className = `bar-fill ${isOn ? "on" : "off"}`
      }
      const nameEl = refs.nameEl
      if (nameEl) nameEl.textContent = name
      const pctEl = refs.pctEl
      if (pctEl) pctEl.textContent = stateText
      const iconDiv = refs.iconDiv
      if (iconDiv) {
        iconDiv.className = `light-icon ${isOn ? "on" : ""}`
        const hi = refs.iconEl
        if (hi && hi.getAttribute("icon") !== icon) hi.setAttribute("icon", icon)
      }
      const pb = refs.powerBtn
      if (pb) pb.className = `power-btn ${isOn ? "on" : ""}`
    })
    this._syncAllPowerButton()
    this._syncStateCache()
  }

  _syncAllPowerButton() {
    const button = this._allPowerBtn || this.shadowRoot?.querySelector(".all-power-btn")
    if (!button) return

    const entityIds = this._getAvailableEntityIds()
    const anyOn = this._hasAnyLightOn(entityIds)
    const label = anyOn ? "Éteindre toutes les lumières" : "Allumer toutes les lumières"

    button.classList.toggle("on", anyOn)
    button.disabled = entityIds.length === 0
    button.title = label
    button.setAttribute("aria-label", label)
  }

  _renderTitleRow() {
    const entityIds = this._getAvailableEntityIds()
    const anyOn = this._hasAnyLightOn(entityIds)
    const label = anyOn ? "Éteindre toutes les lumières" : "Allumer toutes les lumières"
    const disabled = entityIds.length === 0 ? "disabled" : ""
    const title = this._config.title
      ? `<div class="card-title">${this._esc(this._config.title)}</div>`
      : '<div class="card-title card-title--empty"></div>'

    return `
      <div class="card-title-row">
        ${title}
        <button class="all-power-btn ${anyOn ? "on" : ""}" title="${label}" aria-label="${label}" ${disabled}>
          <ha-icon icon="mdi:power"></ha-icon>
        </button>
      </div>
    `
  }

  _render() {
    if (!this._hass || !this._config) return
    if (this._rendered && !this._needsFullRender) {
      this._update()
      return
    }

    const entities = this._config.entities
    const cardBackground = this._resolveCardBackground()
    const showFrame = this._config.show_frame !== false
    const cardTagStart = showFrame ? "<ha-card>" : '<div class="lsc-card lsc-card--frameless">'
    const cardTagEnd = showFrame ? "</ha-card>" : "</div>"

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }
        ha-card,
        .lsc-card {
          --lsc-on-color: ${this._config.bar_color};
          --lsc-off-color: ${this._config.bar_color_off};
          --lsc-on-opacity: ${this._config.bar_opacity};
          --lsc-icon-size: ${this._config.icon_size};
          padding: 16px ${this._config.slider_padding}px;
          background: ${cardBackground.background};
          ${cardBackground.backdropFilter ? `backdrop-filter: ${cardBackground.backdropFilter};` : ""}
          ${cardBackground.backdropFilter ? `-webkit-backdrop-filter: ${cardBackground.backdropFilter};` : ""}
          border-radius: 16px;
          overflow: hidden;
          ${showFrame ? "--ha-card-border-width: 1px;\n          border: 1px solid color-mix(in srgb, var(--divider-color, rgba(127,127,127,0.3)) 65%, transparent);\n          box-shadow: var(--ha-card-box-shadow, none);" : "border: 0;\n          outline: 0;\n          box-shadow: none;"}
        }
        .lsc-card--frameless {
          display: block;
        }
        .card-title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 16px;
          padding: 0 2px;
          min-height: 32px;
        }
        .card-title {
          font-size: 18px;
          font-weight: 600;
          color: var(--primary-text-color, #fff);
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .card-title--empty {
          flex: 1;
        }
        .all-power-btn {
          flex: 0 0 32px;
          width: 32px;
          height: 32px;
          border: none;
          outline: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: rgba(255,255,255,0.07);
          transition: background 0.25s ease, box-shadow 0.25s ease, transform 0.12s ease;
          position: relative;
          overflow: hidden;
        }
        .all-power-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          opacity: 0;
          transition: opacity 0.25s ease;
        }
        .all-power-btn.on {
          background: rgba(255, 152, 0, var(--lsc-on-opacity));
          background: color-mix(in srgb, var(--lsc-on-color) 55%, transparent);
        }
        .all-power-btn.on::before {
          background: var(--lsc-on-color);
          opacity: var(--lsc-on-opacity);
        }
        .all-power-btn ha-icon {
          --mdc-icon-size: 20px;
          color: var(--secondary-text-color, #666);
          transition: color 0.25s ease, filter 0.25s ease;
          z-index: 1;
        }
        .all-power-btn.on ha-icon {
          color: #ffcc02;
          filter: drop-shadow(0 0 6px rgba(255, 204, 2, 0.6));
        }
        .all-power-btn:active {
          transform: scale(0.94);
        }
        .all-power-btn:focus-visible {
          outline: 2px solid var(--primary-color, #03a9f4);
          outline-offset: 2px;
        }
        .all-power-btn:disabled {
          cursor: not-allowed;
          opacity: 0.45;
        }
        .light-row {
          display: flex;
          flex-direction: column;
          margin-bottom: ${this._config.slider_gap}px;
          gap: 4px;
        }
        .light-row:last-child {
          margin-bottom: 0;
        }
        .light-name-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 2px;
        }
        .light-name {
          font-size: 14px;
          font-weight: 500;
          color: var(--primary-text-color, #e0e0e0);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .light-pct {
          font-size: 12px;
          font-weight: 600;
          color: var(--secondary-text-color, #888);
          min-width: 36px;
          text-align: right;
        }
        .light-icon {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .light-icon ha-icon {
          --mdc-icon-size: var(--lsc-icon-size);
          color: var(--secondary-text-color, #aaa);
        }
        .light-icon.on ha-icon {
          color: #ffcc02;
          filter: drop-shadow(0 0 6px rgba(255, 204, 2, 0.5));
        }
        .slider-row {
          display: flex;
          align-items: center;
          gap: 8px;
          height: ${this._config.height}px;
        }
        .slider-container {
          display: flex;
          align-items: center;
          gap: 0;
          flex: 1;
          height: 100%;
          position: relative;
        }
        .bar-track {
          flex: 1;
          height: 100%;
          border-radius: ${this._config.border_radius}px 0 0 ${this._config.border_radius}px;
          background: rgba(255,255,255,0.07);
          position: relative;
          overflow: hidden;
          cursor: pointer;
          user-select: none;
          -webkit-user-select: none;
          touch-action: none;
        }
        .bar-fill {
          position: absolute;
          left: 0; top: 0; bottom: 0;
                    right: 0;
          border-radius: ${this._config.border_radius}px 0 0 ${this._config.border_radius}px;
                    transition: transform 0.2s ease;
                    transform-origin: left center;
                    transform: scaleX(var(--lsc-fill-ratio, 0));
          pointer-events: none;
                    will-change: transform;
        }
        .bar-fill.dragging {
          transition: none;
        }
        .bar-fill.on {
                    background: var(--lsc-on-color);
                    opacity: var(--lsc-on-opacity);
          box-shadow: 0 0 16px rgba(255, 152, 0, 0.25);
        }
        .bar-fill.off {
                    background: var(--lsc-off-color);
        }
        .bar-label {
          position: absolute;
          left: 0; top: 0; right: 0; bottom: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 12px;
          pointer-events: none;
          z-index: 1;
        }
        .bar-label .bar-label-name {
          font-size: 13px;
          font-weight: 500;
          color: var(--primary-text-color, #e0e0e0);
          text-shadow: 0 1px 3px rgba(0,0,0,0.6);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .bar-label .bar-label-pct {
          font-size: 12px;
          font-weight: 600;
          color: var(--primary-text-color, #e0e0e0);
          text-shadow: 0 1px 3px rgba(0,0,0,0.6);
          opacity: 0.8;
          flex-shrink: 0;
          margin-left: 8px;
        }
        .power-btn {
          flex-shrink: 0;
          width: ${this._config.height}px;
          height: ${this._config.height}px;
          border: none;
          outline: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 0 ${this._config.border_radius}px ${this._config.border_radius}px 0;
          background: rgba(255,255,255,0.07);
          transition: background 0.25s ease, box-shadow 0.25s ease;
          position: relative;
          overflow: hidden;
        }
        .power-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          opacity: 0;
          transition: opacity 0.25s ease;
        }
        .power-btn.on {
                    background: rgba(255, 152, 0, var(--lsc-on-opacity));
                    background: color-mix(in srgb, var(--lsc-on-color) 55%, transparent);
        }
        .power-btn.on::before {
                    background: var(--lsc-on-color);
                    opacity: var(--lsc-on-opacity);
        }
        .power-btn ha-icon {
          --mdc-icon-size: 22px;
          color: var(--secondary-text-color, #666);
          transition: color 0.25s ease, filter 0.25s ease;
          z-index: 1;
        }
        .power-btn.on ha-icon {
          color: #ffcc02;
          filter: drop-shadow(0 0 6px rgba(255, 204, 2, 0.6));
        }
        .power-btn:active {
          transform: scale(0.94);
        }
                .power-btn:focus-visible {
                    outline: 2px solid var(--primary-color, #03a9f4);
                    outline-offset: 2px;
                }
        .divider {
          width: 2px;
          height: ${this._config.height}px;
          background: rgba(0,0,0,0.25);
          flex-shrink: 0;
        }
                @media (prefers-reduced-motion: reduce) {
                    .bar-fill,
                    .all-power-btn,
                    .all-power-btn::before,
                    .all-power-btn ha-icon,
                    .power-btn,
                    .power-btn::before,
                    .power-btn ha-icon {
                        transition: none !important;
                    }
                }
                ${
                  this._config.compact_mobile
                    ? `
                @media (max-width: ${this._config.compact_breakpoint}px) {
                    ha-card,
                    .lsc-card {
                        padding: 12px ${this._config.mobile_slider_padding}px;
                    }
                    .card-title-row {
                        margin-bottom: 12px;
                    }
                    .card-title {
                        font-size: 16px;
                    }
                    .all-power-btn {
                        flex-basis: 30px;
                        width: 30px;
                        height: 30px;
                    }
                    .light-row {
                        margin-bottom: ${this._config.mobile_slider_gap}px;
                    }
                    .slider-row {
                        height: ${this._config.mobile_height}px;
                    }
                    .power-btn {
                        width: ${this._config.mobile_height}px;
                        height: ${this._config.mobile_height}px;
                    }
                    .divider {
                        height: ${this._config.mobile_height}px;
                    }
                    .light-icon ha-icon {
                        --mdc-icon-size: ${this._config.mobile_icon_size};
                    }
                    .bar-label {
                        padding: 0 10px;
                    }
                }
                `
                    : ""
                }
      </style>
      ${cardTagStart}
        ${this._renderTitleRow()}
        ${entities.map((entry, idx) => this._renderEntity(entry, idx)).join("")}
      ${cardTagEnd}
    `

    // Bind events after rendering
    entities.forEach((entry, idx) => {
      const { entityId } = this._parseEntity(entry)
      this._bindEvents(entityId, idx)
    })
    this._cacheRowRefs()
    this._bindAllPowerButton()
    this._syncStateCache()

    this._rendered = true
    this._needsFullRender = false
  }

  _renderEntity(entry, idx) {
    const { entityId, customName, customIcon, mode } = this._parseEntity(entry)
    const stateObj = this._hass.states[entityId]
    if (!stateObj) {
      return `<div class="light-row"><span style="color:#ff5555">Entité introuvable: ${this._esc(entityId)}</span></div>`
    }

    const isOn = stateObj.state === "on"
    const brightness = stateObj.attributes.brightness || 0
    const pct =
      mode === "toggle" ? (isOn ? 100 : 0) : isOn ? Math.round((brightness / 255) * 100) : 0
    const name = customName || stateObj.attributes.friendly_name || entityId
    const icon = customIcon || stateObj.attributes.icon || "mdi:lightbulb"
    const stateText = mode === "toggle" ? (isOn ? "On" : "Off") : isOn ? pct + "%" : "Off"

    const inline = this._config.label_position === "inside"

    return `
      <div class="light-row" data-idx="${idx}">
        ${
          !inline
            ? `<div class="light-name-row">
          <span class="light-name">${this._esc(name)}</span>
          ${this._config.show_percentage ? `<span class="light-pct">${stateText}</span>` : ""}
        </div>`
            : ""
        }
        <div class="slider-row">
          <div class="light-icon ${isOn ? "on" : ""}">
            <ha-icon icon="${icon}"></ha-icon>
          </div>
          <div class="slider-container">
            <div class="bar-track" data-entity="${entityId}" data-idx="${idx}">
                            <div class="bar-fill ${isOn ? "on" : "off"}" style="--lsc-fill-ratio:${pct / 100}"></div>
              ${
                inline
                  ? `<div class="bar-label">
                <span class="bar-label-name">${this._esc(name)}</span>
                ${this._config.show_percentage ? `<span class="bar-label-pct">${stateText}</span>` : ""}
              </div>`
                  : ""
              }
            </div>
            <div class="divider"></div>
            <button class="power-btn ${isOn ? "on" : ""}" data-entity="${entityId}" data-idx="${idx}">
              <ha-icon icon="mdi:power"></ha-icon>
            </button>
          </div>
        </div>
      </div>
    `
  }

  _bindEvents(entityId, idx) {
    const entry = this._config.entities[idx]
    const { mode } = this._parseEntity(entry)
    const track = this.shadowRoot.querySelector(`.bar-track[data-idx="${idx}"]`)
    const powerBtn = this.shadowRoot.querySelector(`.power-btn[data-idx="${idx}"]`)
    if (!track || !powerBtn) return

    const doToggle = () => {
      this._hass.callService("light", "toggle", { entity_id: entityId })
      window.dispatchEvent(new CustomEvent("haptic", { detail: "light" }))
    }

    // Power button
    powerBtn.addEventListener("click", (e) => {
      e.stopPropagation()
      doToggle()
    })

    // Toggle mode: click on bar = toggle, no slider drag
    if (mode === "toggle") {
      track.addEventListener("click", () => {
        doToggle()
      })
      return
    }

    // Slider drag (dimmer mode only)
    let _lastHapticPct = -1

    const getPercent = (clientX) => {
      const rect = track.getBoundingClientRect()
      const x = clientX - rect.left
      return Math.max(0, Math.min(100, (x / rect.width) * 100))
    }

    const fill = track.querySelector(".bar-fill")
    const row = track.closest(".light-row")
    const pctLabel = row?.querySelector(".light-pct")
    const barPctLabel = track.querySelector(".bar-label-pct")

    const setFill = (pct) => {
      if (fill) {
        fill.style.setProperty("--lsc-fill-ratio", `${pct / 100}`)
        fill.classList.add("dragging")
      }
      const rounded = Math.round(pct)
      const hapticStep = Math.round(rounded / 4)
      if (hapticStep !== _lastHapticPct) {
        _lastHapticPct = hapticStep
        window.dispatchEvent(new CustomEvent("haptic", { detail: "selection" }))
      }
      const pctText = rounded > 0 ? rounded + "%" : "Off"
      if (pctLabel) pctLabel.textContent = pctText
      if (barPctLabel) barPctLabel.textContent = pctText
    }

    const applyBrightness = (pct) => {
      const brightness = Math.round((pct / 100) * 255)
      if (brightness === 0) {
        this._hass.callService("light", "turn_off", { entity_id: entityId })
      } else {
        this._hass.callService("light", "turn_on", {
          entity_id: entityId,
          brightness: brightness,
        })
      }
    }

    let _liveLastSent = 0
    const liveThrottle = 200
    const maybeLiveUpdate = (pct) => {
      if (!this._config.live_update) return
      const now = Date.now()
      if (now - _liveLastSent >= liveThrottle) {
        _liveLastSent = now
        applyBrightness(pct)
      }
    }

    const stopDragging = (clientX) => {
      if (!this._isDragging) return
      this._isDragging = false
      const finalPct = getPercent(clientX)
      setFill(finalPct)
      applyBrightness(finalPct)
      window.dispatchEvent(new CustomEvent("haptic", { detail: "light" }))
      if (fill) fill.classList.remove("dragging")
    }

    track.addEventListener("pointerdown", (e) => {
      e.preventDefault()
      this._isDragging = true
      window.dispatchEvent(new CustomEvent("haptic", { detail: "selection" }))
      const pct = getPercent(e.clientX)
      setFill(pct)
      if (track.setPointerCapture && e.pointerId !== undefined) {
        track.setPointerCapture(e.pointerId)
      }
    })

    track.addEventListener("pointermove", (e) => {
      if (!this._isDragging) return
      const pct = getPercent(e.clientX)
      setFill(pct)
      maybeLiveUpdate(pct)
    })

    track.addEventListener("pointerup", (e) => {
      stopDragging(e.clientX)
    })

    track.addEventListener("pointercancel", (e) => {
      stopDragging(e.clientX)
    })
  }

  _bindAllPowerButton() {
    const button = this._allPowerBtn
    if (!button) return

    button.addEventListener("click", (e) => {
      e.stopPropagation()
      const entityIds = this._getAvailableEntityIds()
      if (!entityIds.length) return

      const anyOn = this._hasAnyLightOn(entityIds)
      this._hass.callService("light", anyOn ? "turn_off" : "turn_on", { entity_id: entityIds })
      window.dispatchEvent(new CustomEvent("haptic", { detail: "light" }))
    })
  }

  getCardSize() {
    if (!this._config) return 3
    const count = this._config.entities ? this._config.entities.length : 1
    return 1 + count
  }

  static getConfigElement() {
    return document.createElement("light-slider-card-editor")
  }

  static getStubConfig() {
    return {
      entities: ["light.example"],
      title: "Lumières",
    }
  }

  static getGridOptions() {
    return {
      columns: 12,
      min_columns: 6,
      rows: 2,
      min_rows: 2,
    }
  }
}

customElements.define("light-slider-card", LightSliderCard)

window.customCards = window.customCards || []
window.customCards.push({
  type: "light-slider-card",
  name: "Light Slider Card",
  description: "Contrôle de lumière avec bargraphe et bouton power",
  preview: true,
})

console.info(
  "%c LIGHT-SLIDER-CARD %c v1.3.0 ",
  "color: #fff; background: #ff9800; font-weight: bold; padding: 2px 6px; border-radius: 4px 0 0 4px;",
  "color: #ff9800; background: #1c1c1e; font-weight: bold; padding: 2px 6px; border-radius: 0 4px 4px 0;"
)
