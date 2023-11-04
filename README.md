# Clocktower

Clock tower is a realtime sharable clock interface for tracking tabletop role playing clocks (used in systems like Blades in the Dark, Fabula Ultima, etc)

#### Creating a Loading State

Implementing a loading indicator that can be triggered from various points in your app is a common requirement. Here's a general approach on how you could implement this in a Next.js application using a global context to manage the loading state:

1. **Create a Loading Context**:
   Create a context to hold the loading state. This context can have a boolean value to indicate whether a loading operation is in progress, and functions to set and clear this state.

```typescript
import React, { createContext, useState, useContext } from "react";

interface LoadingContextProps {
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

export const LoadingContext = createContext<LoadingContextProps | undefined>(
  undefined
);

export const LoadingProvider: React.FC = ({ children }) => {
  const [loading, setLoading] = useState<boolean>(false);

  return (
    <LoadingContext.Provider value={{ loading, setLoading }}>
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error("useLoading must be used within a LoadingProvider");
  }
  return context;
};
```

2. **Wrap Your App**:
   Wrap your app with the `LoadingProvider` at a high level in your component tree, such as in your `_app.tsx` file, so that the loading context is available throughout your app.

```tsx
// _app.tsx
import { LoadingProvider } from "@/context/loading";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <LoadingProvider>
      <Component {...pageProps} />
    </LoadingProvider>
  );
}

export default MyApp;
```

3. **Create a Loading Indicator Component**:
   Create a component for the loading indicator, which reads the loading state from the `LoadingContext` and renders a spinner or other indicator accordingly.

```tsx
// components/LoadingIndicator.tsx
import { useLoading } from "@/context/loading";

const LoadingIndicator: React.FC = () => {
  const { loading } = useLoading();

  return loading ? <div className="loading-spinner"></div> : null;
};

export default LoadingIndicator;
```

4. **Trigger Loading State**:
   Now you can trigger the loading state from anywhere in your app using the `setLoading` function from the `LoadingContext`. For example, you could set `loading` to `true` at the beginning of an async function and set it back to `false` once the async operation has completed.

```tsx
const { setLoading } = useLoading();

const handleSomeAsyncOperation = async () => {
  setLoading(true);
  try {
    // some async operation
  } finally {
    setLoading(false);
  }
};
```

5. **Display the Loading Indicator**:
   Include the `LoadingIndicator` component in your layout or wherever you want the loading indicator to appear.

```tsx
// components/Layout.tsx
import LoadingIndicator from "./LoadingIndicator";

const Layout: React.FC = ({ children }) => {
  return (
    <div>
      <LoadingIndicator />
      {/* rest of your layout */}
      {children}
    </div>
  );
};

export default Layout;
```

This way, you have a centralized way of handling loading state that can be triggered from anywhere in your app, and a loading indicator that responds to changes in this state.
