# Pointer Tracking System - Complete Guide

## Overview

A comprehensive real-time pointer tracking system with velocity-based cursor acceleration, multi-button support, and cross-device compatibility.

## Features

### 1. Velocity-Based Cursor Acceleration
- Tracks movement speed in real-time
- Calculates cursor acceleration multiplier (1.0x - 2.5x)
- Smoother exponential moving average for velocity
- Scales from 1.0x (slow movement) to 2.5x (fast movement)

### 2. Multi-Button Support
- **Left Click** (Button 0) - Primary button
- **Middle Click** (Button 1) - Wheel button
- **Right Click** (Button 2) - Context menu
- **Back Button** (Button 3) - Browser back
- **Forward Button** (Button 4) - Browser forward
- **Touch** - Mobile and tablet touch events

### 3. Cross-Device Support
- Desktop mouse tracking with all button types
- Mobile touch tracking with pressure sensitivity
- Tablet stylus support (pressure and tilt)
- Automatic device type detection

### 4. Real-Time Tracking
- High-frequency position updates
- Velocity calculation with smoothing
- Movement speed measurement
- Button state tracking
- Touch pressure and tilt angles

## Architecture

### Core Services

#### `PointerTrackerService` (`lib/pointer-tracker-service.ts`)
Main singleton service handling all pointer tracking:

```typescript
// Get instance
const tracker = getPointerTracker()

// Subscribe to events
const unsubscribe = tracker.subscribe((event: PointerEvent) => {
  console.log('Pointer event:', event)
})

// Get cursor acceleration
const acceleration = tracker.getCursorAcceleration(speed)

// Get current state
const state = tracker.getState()
```

#### `usePointerTracker` Hook (`hooks/use-pointer-tracker.ts`)
React hook for easy integration:

```typescript
const { pointerState, getCursorAcceleration, getState, getAverageVelocity } = 
  usePointerTracker({
    enabled: true,
    trackMouseEvents: true,
    trackTouchEvents: true,
    onMove: (event) => console.log('Moving:', event),
    onDown: (event) => console.log('Button down:', event),
    onUp: (event) => console.log('Button up:', event),
    onClick: (event) => console.log('Click:', event),
  })
```

### Components

#### 1. `VelocityCursor` Component
Custom cursor with velocity visualization:

```typescript
<VelocityCursor
  enabled={true}
  showTrail={true}
  sensitivity={1.0}
/>
```

Features:
- Scales based on movement speed
- Animated trail effect
- Button indicator
- Speed pulse animation

#### 2. `PointerTrackerDisplay` Component
Real-time stats widget:

```typescript
<PointerTrackerDisplay />
```

Shows:
- Current position (X, Y)
- Movement speed
- Cursor acceleration
- Active button
- Movement status
- Detailed velocity metrics

## Usage Examples

### Basic Integration

```typescript
import { usePointerTracker } from '@/hooks/use-pointer-tracker'

export function MyComponent() {
  const { pointerState, getCursorAcceleration } = usePointerTracker()

  const acceleration = getCursorAcceleration()

  return (
    <div>
      <p>X: {pointerState.x}, Y: {pointerState.y}</p>
      <p>Speed: {pointerState.speed.toFixed(2)} px/ms</p>
      <p>Acceleration: {acceleration.toFixed(2)}x</p>
      <p>Button: {pointerState.button || 'None'}</p>
    </div>
  )
}
```

### With Event Handlers

```typescript
const { pointerState } = usePointerTracker({
  onMove: (event) => {
    // Handle movement
    applyMouseCursorEffect(event.x, event.y, event.speed)
  },
  onDown: (event) => {
    // Handle button press
    handleButtonPress(event.button)
  },
  onUp: (event) => {
    // Handle button release
    handleButtonRelease(event.button)
  },
  onClick: (event) => {
    // Handle click
    if (event.button === 'back') {
      window.history.back()
    } else if (event.button === 'forward') {
      window.history.forward()
    }
  },
})
```

### Multi-Button Actions

```typescript
const { pointerState } = usePointerTracker({
  onClick: (event) => {
    switch (event.button) {
      case 'left':
        console.log('Left click at:', event.x, event.y)
        break
      case 'right':
        console.log('Right click - open context menu')
        break
      case 'middle':
        console.log('Middle click - open in new tab')
        break
      case 'back':
        console.log('Back button - navigate back')
        navigation.back()
        break
      case 'forward':
        console.log('Forward button - navigate forward')
        navigation.forward()
        break
      case 'touch':
        console.log('Touch event at:', event.x, event.y)
        break
    }
  },
})
```

## API Reference

### PointerState

```typescript
interface PointerState {
  x: number              // Current X position
  y: number              // Current Y position
  velocityX: number      // X velocity (px/ms)
  velocityY: number      // Y velocity (px/ms)
  speed: number          // Combined speed (px/ms)
  button: string | null  // Active button
  isMoving: boolean      // Movement status
  timestamp: number      // Update timestamp
}
```

### PointerEvent

```typescript
interface PointerEvent {
  x: number              // Position X
  y: number              // Position Y
  velocityX: number      // X velocity
  velocityY: number      // Y velocity
  speed: number          // Combined speed
  button: string         // Button type
  type: 'move' | 'down' | 'up' | 'click'
  clientX: number        // Client X coordinate
  clientY: number        // Client Y coordinate
  screenX: number        // Screen X coordinate
  screenY: number        // Screen Y coordinate
  movementX: number      // Delta X
  movementY: number      // Delta Y
  pointerType: 'mouse' | 'touch' | 'pen'
  isPressure: boolean    // Pressure detected
  pressure: number       // Pressure value (0-1)
  tiltX: number          // Pen tilt X
  tiltY: number          // Pen tilt Y
}
```

### Service Methods

```typescript
// Get cursor acceleration multiplier
getCursorAcceleration(speed: number): number

// Get current pointer state
getState(): PointerState

// Get average velocity from history
getAverageVelocity(): { vx: number; vy: number }

// Subscribe to events
subscribe(listener: (event: PointerEvent) => void): () => void

// Start tracking
startTracking(): void

// Stop tracking
stopTracking(): void

// Get device type
getDeviceType(): 'desktop' | 'mobile' | 'unknown'

// Reset tracking
reset(): void
```

## Performance Considerations

1. **Event Throttling**: Events are processed at high frequency for smooth tracking
2. **Velocity Smoothing**: Uses exponential moving average to reduce jitter
3. **History Size**: Limited to 10 samples to keep memory usage low
4. **Canvas Optimization**: Trail drawing uses canvas for better performance
5. **Listener Cleanup**: Automatic cleanup on component unmount

## Browser Support

- Modern browsers with PointerEvents API support
- Fallback to MouseEvent for older browsers
- Touch event support for mobile
- Pen/Stylus support for tablets

## Mobile Considerations

- Touch events tracked with full position and pressure data
- Automatic device type detection
- Works with multi-touch (uses first touch)
- Optimized for performance on lower-end devices

## Customization

### Adjust Sensitivity

```typescript
<VelocityCursor sensitivity={1.5} />
```

### Disable Trail

```typescript
<VelocityCursor showTrail={false} />
```

### Disable Custom Cursor

```typescript
<VelocityCursor enabled={false} />
```

### Change Smoothing Factor

Edit `SMOOTHING_FACTOR` in `lib/pointer-tracker-service.ts`:
```typescript
private smoothingFactor = 0.3 // Range: 0.1 (more smooth) to 0.9 (more responsive)
```

## Demo Page

Visit `/pointer-demo` to see the system in action with:
- Real-time statistics
- Configurable settings
- Interactive controls
- Feature documentation

## Troubleshooting

### High CPU Usage
- Disable trail effect: `showTrail={false}`
- Reduce event listener frequency
- Check for excessive re-renders

### Cursor Lag
- Increase sensitivity
- Reduce smoothing factor
- Check system performance

### Touch Not Working
- Ensure `trackTouchEvents={true}` in hook options
- Check browser permissions
- Verify Touch Events are supported

### Back/Forward Buttons Not Working
- Check if browser supports auxclick event
- Some mice may require driver updates
- Verify Button 3-4 are detected in demo

## Integration Examples

### With Game Engine
```typescript
// Pass acceleration to game camera
const acceleration = getCursorAcceleration()
camera.rotationSpeed = acceleration * baseSpeed
```

### With Drawing App
```typescript
// Use velocity for brush stroke thickness
const thickness = 1 + (pointerState.speed * 2)
drawBrush(pointerState.x, pointerState.y, thickness)
```

### With UI Interaction
```typescript
// Scale UI elements based on pointer movement
const scale = getCursorAcceleration()
element.style.transform = `scale(${scale})`
```

## Resources

- [PointerEvents API](https://developer.mozilla.org/en-US/docs/Web/API/PointerEvent)
- [MouseEvent Reference](https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent)
- [Touch Events](https://developer.mozilla.org/en-US/docs/Web/API/Touch_events)
