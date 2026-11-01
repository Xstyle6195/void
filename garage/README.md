# Atelier Prépa

Jeu de gestion où vous êtes **préparateur automobile** : vous achetez des voitures existantes, vous les restaurez ou les transformez (mécanique, carrosserie, intérieur), puis vous les revendez pour gagner de l'argent et de la réputation. Les plus belles deviennent de véritables **pièces de collection**.

Toutes les marques et tous les modèles sont fictifs.

## Lancer le jeu

```bash
cd garage
npm install
npm run dev
```

La partie est sauvegardée automatiquement dans le navigateur (localStorage).

## Boucle de jeu

1. **Achat** : le marché propose chaque semaine des occasions (populaires, anciennes à collectionner, sorties de grange) et des modèles neufs de grandes marques. Chaque voiture s'achète à l'unité. L'état annoncé par le vendeur est souvent optimiste : une **inspection** (2 h d'atelier) révèle l'état réel de chaque pièce. Les modèles prestigieux exigent une certaine réputation.
2. **Conception** : 14 pièces réparties en trois domaines (🔧 mécanique, 🚗 carrosserie, 💺 intérieur). Pour chaque pièce, vous pouvez :
   - **Restaurer** : peu cher, conserve 100 % d'originalité, plafonné à ~90 % d'état (impossible sous 15 %) ;
   - **Remplacer par une pièce d'origine neuve** : état 100 %, originalité 85 %, chère sur les anciens rares ;
   - **Améliorer** : pièces performance, esthétiques ou luxe (Stage 1/2, suspensions, kits aéro, peintures personnalisées, cuir sur-mesure…) ;
   - **Swapper le moteur** (avec banc moteur) : du 4 cylindres turbo au V12, en passant par la conversion électrique.
   Chaque opération coûte de l'argent et des **heures d'atelier** (40 h/semaine, plus avec des mécaniciens).
3. **Vente** : choisissez la promotion (petites annonces, réseaux sociaux, salon auto, enchères prestige). Chaque canal attire un mélange d'acheteurs (particuliers, passionnés de performance, amateurs de luxe, collectionneurs) qui valorisent différemment votre travail. Vous acceptez ou refusez les offres.
4. **Commandes spéciales** : des clients privés vous demandent de trouver et préparer un modèle précis, ou vous confient leur voiture (préparation, concours d'élégance). Vous acceptez ou refusez ; un délai dépassé coûte de la réputation.

## Labels

- 🏆 **Pièce de collection** : modèle ancien (≤ 2000, rareté ≥ 2), état ≥ 90 % et originalité ≥ 85 %. Cote fortement majorée.
- ⚡ **Restomod** : ancien modifié, en excellent état et nettement plus performant ou luxueux.
- 💎 **Préparation d'exception** : voiture récente parfaitement préparée.

Vos réalisations peuvent être gardées dans votre **collection personnelle**, qui rapporte de la réputation chaque semaine.

## Atelier

Places supplémentaires, mécaniciens, banc moteur, cabine de peinture, atelier sellerie, outillage de restauration pro et showroom. Attention aux charges hebdomadaires : quatre semaines de découvert et c'est la faillite.

## Code

- `src/game/` : logique pure du jeu (données, calcul des stats et de la cote, moteur de tour).
- `src/state/store.ts` : store zustand + sauvegarde.
- `src/components/` : interface React.
