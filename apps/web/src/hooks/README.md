# Reusable Touch Handlers

## `useTouchHandlers`

A custom React hook that provides mobile-friendly touch event handling with support for **tap** and **long press** gestures.

### Features

- ✅ **Tap detection**: Quick touch and release
- ⏰ **Long press detection**: Hold for configurable duration
- 🚫 **Movement cancellation**: Automatically cancels gestures when scrolling
- 🎯 **Configurable**: Customize delays and thresholds
- 📱 **Mobile-first**: Designed for touch interfaces
- 🔇 **Can be disabled**: Useful for desktop-only interactions

### Basic Usage

```tsx
import { useTouchHandlers } from '../../hooks/useTouchHandlers';

function MyComponent() {
  const touchHandlers = useTouchHandlers({
    onTap: () => console.log('Tapped!'),
    onLongPress: () => console.log('Long pressed!'),
  });

  return <div {...touchHandlers}>Touch me!</div>;
}
```

### Advanced Usage

```tsx
import { useTouchHandlers } from '../../hooks/useTouchHandlers';

function AdvancedComponent() {
  const [selectedItem, setSelectedItem] = useState(null);

  const touchHandlers = useTouchHandlers({
    onTap: () => {
      // Handle quick tap - navigate or select
      setSelectedItem(item);
    },
    onLongPress: () => {
      // Handle long press - show context menu or actions
      showContextMenu(item);
    },
    longPressDelay: 600, // Wait 600ms before long press (default: 500)
    movementThreshold: 15, // Allow 15px movement (default: 10)
    disabled: !isMobileDevice(), // Only enable on mobile
  });

  return (
    <div className="item" {...touchHandlers}>
      {item.name}
    </div>
  );
}
```

### Options

| Option              | Type         | Default     | Description                                                               |
| ------------------- | ------------ | ----------- | ------------------------------------------------------------------------- |
| `onTap`             | `() => void` | `undefined` | Callback for quick tap (release before `longPressDelay` without movement) |
| `onLongPress`       | `() => void` | `undefined` | Callback for long press (hold for `longPressDelay`)                       |
| `longPressDelay`    | `number`     | `500`       | Time in milliseconds to hold before triggering long press                 |
| `movementThreshold` | `number`     | `10`        | Distance in pixels that cancels tap/long press (indicates scrolling)      |
| `disabled`          | `boolean`    | `false`     | Whether touch handlers are disabled                                       |

### Returns

An object with three touch event handlers to spread on your element:

```typescript
{
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
}
```

### How It Works

1. **Touch Start**: Records initial finger position and starts long press timer
2. **Touch Move**: Monitors finger movement; cancels long press if > threshold
3. **Touch End**:
   - If timer still running + no movement → triggers `onTap`
   - If timer already fired → long press already handled
   - If movement detected → no action (scrolling)

### Debug Logs

The hook includes console logs (with emojis!) for debugging:

- 📱 Touch START/END with position data
- ⏰ Long press triggered
- ✅ TAP triggered
- 🚫 Movement detected (gesture canceled)

Remove these logs in production if needed.

### Real-World Example

See [CalendarDay.tsx](../components/Calendar/CalendarDay.tsx) and [WeekDay.tsx](../components/Calendar/WeekDay.tsx) for real implementations used in the calendar component.

### Desktop Compatibility

Set `disabled: true` on desktop to avoid interfering with click events:

```tsx
const isMobile = () => window.innerWidth <= 768;

const touchHandlers = useTouchHandlers({
  onTap: handleTap,
  onLongPress: handleLongPress,
  disabled: !isMobile(), // Only enable on mobile
});
```

### Notes

- The hook automatically calls `preventDefault()` when safe to prevent default browser behaviors like text selection
- Works great with drag-and-drop (won't interfere when movement is detected)
- Timer is automatically cleaned up on unmount
