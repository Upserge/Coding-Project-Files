# Vehicle GLB Models

Place your `.glb` vehicle model files in this directory.

## Naming Convention

| Obstacle Type | Expected Files                       |
|---------------|--------------------------------------|
| `sedan`       | `sedan_*.glb` (one per colour/style) |

Add new variants by dropping a `sedan_<variant>.glb` file here and
registering its key + path in `vehicle-model.config.ts`.

## Sizing

Models are automatically scaled at load time to match the bounding-box
dimensions defined in `vehicle-model.config.ts`. Author models at any
convenient scale — the loader normalises them.

## Orientation

Models should face the **+Z** direction (front of the vehicle toward +Z).
Apply a `rotationOffset` in the config if your model faces a different axis.
