<div align="center">

# 💡 Light Slider Card — Home Assistant Card

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-orange.svg?style=for-the-badge)](https://hacs.xyz)
[![HA Version](https://img.shields.io/badge/Home%20Assistant-2024.1%2B-blue?style=for-the-badge&logo=home-assistant)](https://www.home-assistant.io)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)
[![Version](https://img.shields.io/github/v/release/Micpi/light-slider-card?style=for-the-badge&label=Version)](https://github.com/Micpi/light-slider-card/releases/latest)
[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-Support-FFDD00?style=for-the-badge&logo=buymeacoffee&logoColor=000000)](https://buymeacoffee.com/mickaelpila)

**Carte Lovelace dédiée au contrôle rapide des lumières dans Home Assistant.**  
Ajustez l'intensité et l'état de vos luminaires avec un rendu compact et lisible.

</div>

---

## ✨ Points forts

- controle rapide d une ou plusieurs lumieres
- slider fluide avec retour visuel immediat
- mode dimmer ou toggle par entite
- configuration visuelle disponible dans Lovelace
- presentation compacte adaptee au mobile

## 📦 Installation

1. Copier `light-slider-card.js` dans `/config/www/`
2. Ajouter la ressource dans Home Assistant :
   - **Paramètres** → **Tableaux de bord** → **⋮** (3 points) → **Ressources**
   - Ajouter : `/local/light-slider-card.js` — Type : **Module JavaScript**
3. Recharger la page (Ctrl+F5)

## 🧪 Utilisation

### Configuration minimale

```yaml
type: custom:light-slider-card
entity: light.salon
```

### Plusieurs lumières

```yaml
type: custom:light-slider-card
title: Lumières
entities:
  - light.salon
  - light.cuisine
  - light.chambre
  - light.bureau
```

### Toutes les options

```yaml
type: custom:light-slider-card
title: Éclairage
entities:
  - entity: light.salon
    name: Salon
    icon: mdi:sofa-outline
    mode: dimmer
  - entity: light.cuisine
    mode: toggle
bar_color: "linear-gradient(90deg, #ff9800, #ffcc02)"
bar_color_off: "#3a3a3a"
bar_opacity: 0.85
height: 48
border_radius: 14
icon_size: "24px"
slider_gap: 14
slider_padding: 16
show_percentage: true
live_update: false
label_position: above
background_style: default
background_blur: 18
card_background: "var(--ha-card-background)"

# Compact mobile
compact_mobile: true
compact_breakpoint: 560
mobile_height: 40
mobile_slider_gap: 10
mobile_slider_padding: 12
mobile_icon_size: "21px"
```

## 🧭 Options

- `entity` (défaut: —): Entité lumière unique.
- `entities` (défaut: —): Liste d'entités lumière (`string` ou objet).
- `title` (défaut: —): Titre affiché en haut de la carte.
- `bar_color` (défaut: `linear-gradient(90deg, #ff9800, #ffcc02)`): Couleur/gradient de la barre ON.
- `bar_color_off` (défaut: `#3a3a3a`): Couleur de la barre OFF.
- `bar_opacity` (défaut: `0.85`): Opacité de la barre ON (0 à 1).
- `height` (défaut: `48`): Hauteur du slider (px).
- `border_radius` (défaut: `14`): Arrondi des coins (px).
- `background_style` (défaut: `default`): `default`, `transparent`, `gradient`, `blur`, `glass` ou `custom`.
- `background_blur` (défaut: `18`): Force de flou utilisée par les modes `blur` et `glass`.
- `card_background` (défaut: `var(--ha-card-background)`): Fond CSS personnalisé utilisé si `background_style: custom`.
- `icon_size` (défaut: `24px`): Taille de l'icône desktop.
- `slider_gap` (défaut: `14`): Espacement vertical entre sliders (px).
- `slider_padding` (défaut: `16`): Padding horizontal de la carte (px).
- `show_percentage` (défaut: `true`): Afficher le pourcentage/état.
- `live_update` (défaut: `false`): Envoie les changements pendant le glissement.
- `label_position` (défaut: `above`): `above` ou `inside` (dans la barre).
- `compact_mobile` (défaut: `true`): Active le mode compact mobile.
- `compact_breakpoint` (défaut: `560`): Largeur max (px) pour activer le mode compact.
- `mobile_height` (défaut: `height - 8`, min 36): Hauteur du slider en mode compact.
- `mobile_slider_gap` (défaut: `slider_gap - 4`, min 8): Espacement en mode compact.
- `mobile_slider_padding` (défaut: `slider_padding - 4`, min 8): Padding horizontal en mode compact.
- `mobile_icon_size` (défaut: `icon_size - 3`): Taille de l'icône en mode compact.

### Exemples de fond

```yaml
# Fond transparent
background_style: transparent

# Fond dégradé doux
background_style: gradient

# Glassmorphism avec flou réglable
background_style: glass
background_blur: 24

# Fond CSS entièrement personnalisé
background_style: custom
card_background: "linear-gradient(145deg, rgba(0,0,0,0.55), rgba(0,0,0,0.20))"
```

## 🧭 Options par entité (`entities`)

Chaque entrée de `entities` peut être :

- une string : `light.salon`
- un objet :

```yaml
entities:
  - entity: light.salon
    name: Salon
    icon: mdi:sofa-outline
    mode: dimmer
  - entity: light.couloir
    mode: toggle
```

Clés disponibles par entité :

- `entity` (défaut: —): Entité lumière.
- `name` (défaut: nom HA): Nom affiché personnalisé.
- `icon` (défaut: icône HA): Icône personnalisée.
- `mode` (défaut: `dimmer`): `dimmer` (slider) ou `toggle` (on/off).

## Fonctionnement

- **Glisser** sur le bargraphe pour régler la luminosité
- **Cliquer** sur le bouton ⏻ en bout de barre pour allumer/éteindre
- Mettre la luminosité à 0 éteint automatiquement la lumière
- En mode `toggle`, cliquer sur la barre agit comme un bouton ON/OFF

## Recommandations

- utilisez `entities` pour regrouper plusieurs zones d eclairage dans un seul bloc
- laissez `live_update: false` si vous voulez limiter les appels pendant le glissement
- gardez `compact_mobile` active sur smartphone pour une carte plus dense

## 🛠️ Editeur

La carte peut etre ajoutee depuis le picker Lovelace puis ajustee visuellement avant une finition YAML si necessaire.
