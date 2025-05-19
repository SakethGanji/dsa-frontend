// Adapted from shadcn/ui (https://ui.shadcn.com/docs/components/toast)
import * as React from "react";
import { type ToastProps } from "@/components/ui/toast";

// Define ActionElement type directly
type ToastActionElement = React.ReactElement;

const TOAST_LIMIT = 5;
const TOAST_REMOVE_DELAY = 1000;

type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
  open?: boolean;
};

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const;

let count = 0;

function genId() {
  count = (count + 1) % Number.MAX_VALUE;
  return count.toString();
}

type ActionType = typeof actionTypes;

type Action =
  | {
      type: ActionType["ADD_TOAST"];
      toast: ToasterToast;
    }
  | {
      type: ActionType["UPDATE_TOAST"];
      toast: Partial<ToasterToast>;
    }
  | {
      type: ActionType["DISMISS_TOAST"];
      toastId?: string;
    }
  | {
      type: ActionType["REMOVE_TOAST"];
      toastId?: string;
    };

interface State {
  toasts: ToasterToast[];
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      };

    case "DISMISS_TOAST": {
      const { toastId } = action;

      // ! Side effects ! - This could be extracted into a dismissToast() action,
      // but I'll keep it here for simplicity
      if (toastId) {
        addToRemoveQueue(toastId);
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id);
        });
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      };
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
  }
};

// Create a simple useState implementation for toast state
const useToastState = () => {
  const [state, setState] = React.useState<State>({ toasts: [] });
  
  const dispatch = React.useCallback((action: Action) => {
    setState((prev) => reducer(prev, action));
  }, []);
  
  return { state, dispatch };
};

// Store the state and dispatch at the module level
let toastState: State = { toasts: [] };
let toastDispatch: React.Dispatch<Action> = () => {};

// Function to initialize the toast system, call this in your app's root
export const InitializeToast = () => {
  const { state, dispatch } = useToastState();
  React.useEffect(() => {
    toastState = state;
    toastDispatch = dispatch;
  }, [state, dispatch]);
  return null; // Or return a fragment if preferred
};

function addToRemoveQueue(toastId: string) {
  if (toastTimeouts.has(toastId)) {
    return;
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    toastDispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    });
  }, TOAST_REMOVE_DELAY);

  toastTimeouts.set(toastId, timeout);
}

export type ToastMessage = Omit<ToasterToast, "id">;

function toast(props: ToastMessage) {
  const id = genId();

  const update = (props: ToastMessage) =>
    toastDispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    });

  const dismiss = () => toastDispatch({ type: "DISMISS_TOAST", toastId: id });

  toastDispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss();
      },
    },
  });

  return {
    id,
    dismiss,
    update,
  };
}

function useToast() {
  return {
    toasts: toastState.toasts,
    toast,
    dismiss: (toastId?: string) => {
      toastDispatch({ type: "DISMISS_TOAST", toastId });
    },
  };
}

export { useToast, toast };
export type { ToastActionElement };

