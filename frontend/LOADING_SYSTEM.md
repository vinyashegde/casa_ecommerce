# Loading System Documentation

This document describes the comprehensive loading system implemented in the Casa frontend application.

## Overview

The loading system provides multiple types of loading indicators to improve user experience:

1. **Splash Screen** - App initialization loading
2. **Page Loader** - Full page loading overlay
3. **Loading Spinner** - Inline loading indicators
4. **Global Loading Context** - App-wide loading state management

## Components

### 1. SplashScreen

A full-screen loading screen shown during app initialization.

```tsx
import SplashScreen from './components/SplashScreen';

<SplashScreen 
  onFinished={() => setShowSplash(false)} 
  duration={2500} 
/>
```

**Props:**
- `onFinished`: Callback when splash screen completes
- `duration`: Display duration in milliseconds (default: 2000)

**Features:**
- Animated logo with gradient background
- Customizable branding area for your logo
- Smooth fade out transition

### 2. PageLoader

Full page loading overlay for page transitions.

```tsx
import PageLoader from './components/PageLoader';

<PageLoader 
  text="Loading products..." 
  overlay={true} 
/>
```

**Props:**
- `text`: Loading message (default: "Loading...")
- `overlay`: Whether to show as overlay (default: false)

### 3. LoadingSpinner

Inline loading spinner for buttons and small sections.

```tsx
import LoadingSpinner from './components/LoadingSpinner';

<LoadingSpinner 
  size="md" 
  color="blue" 
  text="Processing..." 
/>
```

**Props:**
- `size`: 'sm' | 'md' | 'lg' (default: 'md')
- `color`: 'blue' | 'purple' | 'white' | 'gray' (default: 'blue')
- `text`: Optional loading text

### 4. LoadingContext

Global loading state management across the app.

```tsx
import { useLoading } from './contexts/LoadingContext';

const { showPageLoader, hidePageLoader, isPageLoading } = useLoading();

// Show global loader
showPageLoader('Fetching data...');

// Hide global loader
hidePageLoader();
```

## Hooks

### useLoading Hook

Custom hook for managing loading states with minimum duration.

```tsx
import { useLoading } from './hooks/useLoading';

const { isLoading, startLoading } = useLoading(
  async () => {
    // Your async operation
    await fetchData();
  },
  { minDuration: 500 }
);
```

### usePageTransition Hook

Hook for smooth page transitions.

```tsx
import { usePageTransition } from './hooks/useLoading';

const { isTransitioning, startTransition } = usePageTransition(300);
```

## Higher-Order Component

### withPageLoader

HOC to add loading functionality to any page component.

```tsx
import withPageLoader from './components/withPageLoader';

const MyPage = () => <div>Page content</div>;

export default withPageLoader(MyPage, {
  loadingText: "Loading page...",
  minLoadingTime: 500,
  showLoader: true
});
```

## Usage Examples

### Button with Loading State

```tsx
const [isSubmitting, setIsSubmitting] = useState(false);

<button 
  onClick={handleSubmit} 
  disabled={isSubmitting}
  className="btn-primary"
>
  {isSubmitting ? (
    <div className="flex items-center space-x-2">
      <LoadingSpinner size="sm" color="white" />
      <span>Submitting...</span>
    </div>
  ) : (
    'Submit'
  )}
</button>
```

### Page with Loading State

```tsx
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  const loadData = async () => {
    try {
      await fetchPageData();
    } finally {
      setIsLoading(false);
    }
  };
  loadData();
}, []);

if (isLoading) {
  return <PageLoader text="Loading page data..." />;
}

return <div>Page content</div>;
```

### Global Loading with Context

```tsx
const { showPageLoader, hidePageLoader } = useLoading();

const handleGlobalAction = async () => {
  showPageLoader('Processing request...');
  try {
    await globalApiCall();
  } finally {
    hidePageLoader();
  }
};
```

## Customization

### Adding Your Logo

Replace the placeholder logo in `SplashScreen.tsx`:

```tsx
// Replace this section with your logo
<div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600">
  <img src="/path/to/your/logo.png" alt="Logo" className="w-full h-full object-contain" />
</div>
```

### Custom Animations

Add custom CSS animations in `index.css`:

```css
@keyframes custom-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.animate-custom-spin {
  animation: custom-spin 1s linear infinite;
}
```

### Theme Colors

Modify colors in component files or add CSS variables:

```css
:root {
  --loading-primary: #3b82f6;
  --loading-secondary: #8b5cf6;
  --loading-background: #111827;
}
```

## Best Practices

1. **Use appropriate loading indicators**:
   - Splash screen for app initialization
   - Page loader for route changes
   - Spinners for button actions

2. **Provide meaningful loading text**:
   - "Loading products..." instead of "Loading..."
   - "Submitting order..." for order submission

3. **Set minimum loading times**:
   - Prevents flickering on fast connections
   - Provides consistent user experience

4. **Handle errors gracefully**:
   - Show error states when loading fails
   - Provide retry mechanisms

5. **Optimize performance**:
   - Preload critical images
   - Use React.Suspense for code splitting
   - Implement proper cleanup in useEffect

## Testing

Visit `/loading-demo` to test all loading components interactively.

## File Structure

```
src/
├── components/
│   ├── SplashScreen.tsx
│   ├── PageLoader.tsx
│   ├── LoadingSpinner.tsx
│   ├── withPageLoader.tsx
│   └── LoadingDemo.tsx
├── contexts/
│   └── LoadingContext.tsx
├── hooks/
│   └── useLoading.ts
└── utils/
    └── imageUtils.ts
```