# Light Slider Card

Carte Lovelace personnalisée pour Home Assistant — contrôle de lumière avec bargraphe + bouton power.

![preview](https://img.shields.io/badge/HA-Custom_Card-orange)

## Installation

1. Copier `light-slider-card.js` dans `/config/www/`
2. Ajouter la ressource dans Home Assistant :
   - **Paramètres** → **Tableaux de bord** → **⋮** (3 points) → **Ressources**
   - Ajouter : `/local/light-slider-card.js` — Type : **Module JavaScript**
3. Recharger la page (Ctrl+F5)

## Utilisation

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
  - light.salon
  - light.cuisine
bar_color: "linear-gradient(90deg, #ff9800, #ffcc02)"
bar_color_off: "#3a3a3a"
height: 48
border_radius: 14
icon_size: "24px"
show_percentage: true
card_background: "var(--ha-card-background)"
```

## Options

| Option            | Défaut                                              | Description                        |
| ----------------- | --------------------------------------------------- | ---------------------------------- |
| `entity`          | —                                                   | Entité lumière unique              |
| `entities`        | —                                                   | Liste d'entités lumière            |
| `title`           | —                                                   | Titre affiché en haut de la carte  |
| `bar_color`       | `linear-gradient(90deg, #ff9800, #ffcc02)`          | Couleur/gradient de la barre ON    |
| `bar_color_off`   | `#3a3a3a`                                           | Couleur de la barre OFF            |
| `height`          | `48`                                                | Hauteur du slider (px)             |
| `border_radius`   | `14`                                                | Arrondi des coins (px)             |
| `icon_size`       | `24px`                                              | Taille de l'icône                  |
| `show_percentage` | `true`                                              | Afficher le pourcentage            |
| `card_background` | `var(--ha-card-background)`                         | Fond de la carte                   |

## Fonctionnement

- **Glisser** sur le bargraphe pour régler la luminosité
- **Cliquer** sur le bouton ⏻ en bout de barre pour allumer/éteindre
- Mettre la luminosité à 0 éteint automatiquement la lumière
