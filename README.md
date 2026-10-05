# Allocation

This is the maintainable Next.js apartment allocation application.

## First-time setup

```powershell
yarn install --frozen-lockfile
yarn dev
```

Application data lives in `data`, and browser-served models, plans, textures, decoders, and brand assets live in `public`. There is no build-time dependency on a legacy application or an external filesystem path.

## Vercel deployment

Commit `public` to the repository so Vercel receives the complete model and texture library. Use Vercel's normal Next.js preset with the repository root as the Root Directory and `yarn build` as the Build Command.

The generated static files total roughly 370 MB. This exceeds Vercel's Hobby static-file limit and requires a Pro project when the complete asset library is bundled with the deployment.

## Current features

- Typed apartment, model-asset, and floor-plan-label contracts
- Shared floor-plan viewer used by the homepage and unit pages
- Complete homepage explorer with the production 360-degree building model
- Synchronized filters, model hover, model selection, and searchable unit list
- Homepage 360 Model and Floor Plans tabs with the original three-panel layout
- Disabled sold/reserved destinations
- Dynamic `/units/[unitNumber]` routes
- Readable Three.js unit viewer with explicit lifecycle and cleanup
- Existing 3D assets, texture mappings, camera fit, and maximum zoom-out opening state

## Where behavior lives

- `lib/data.ts`: data access and unit availability rules
- `lib/floor-plans.ts`: floor/tower selection and label-position fallback
- `components/floor-plans/`: reusable plan UI
- `components/unit-model/UnitModelViewer.tsx`: unit Three.js scene
- `components/building/BuildingViewer.tsx`: homepage scene, raycasting, and apartment mesh highlights
- `components/home/`: explorer state, filters, ranges, and synchronized results
- `lib/three/building-materials.ts`: production KTX2 building materials
- `components/units/`: unit details workspace
