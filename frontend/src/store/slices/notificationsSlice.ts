import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Notification, NotificationService } from '../../services/notification'; // Assuming NotificationService is correctly typed

export interface NotificationsState {
  items: Notification[];
  unreadCount: number;
  isPanelOpen: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: NotificationsState = {
  items: [],
  unreadCount: 0,
  isPanelOpen: false,
  loading: false,
  error: null,
};

// Async Thunks
export const fetchUserNotifications = createAsyncThunk(
  'notifications/fetchUserNotifications',
  async (_, { rejectWithValue }) => {
    try {
      const notifications = await NotificationService.getNotifications();
      const unreadNotifications = await NotificationService.getUnreadNotifications();
      return { notifications, unreadCount: unreadNotifications.length };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch notifications');
    }
  }
);

export const markNotificationAsRead = createAsyncThunk(
  'notifications/markNotificationAsRead',
  async (notificationId: number, { dispatch, rejectWithValue }) => {
    try {
      await NotificationService.markAsRead(notificationId);
      // Dispatch an action to update the specific notification in the items array
      // and potentially refetch unread count or decrement it.
      dispatch(notificationRead(notificationId)); 
      // Optionally, refetch all to get updated unread count accurately
      // dispatch(fetchUserNotifications()); // Or a more targeted unread count update
      return notificationId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to mark notification as read');
    }
  }
);

export const markAllUserNotificationsAsRead = createAsyncThunk(
  'notifications/markAllUserNotificationsAsRead',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      await NotificationService.markAllAsRead();
      dispatch(allNotificationsRead());
      // dispatch(fetchUserNotifications()); // To refresh list and count
      return true;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to mark all notifications as read');
    }
  }
);


const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    toggleNotificationPanel: (state) => {
      state.isPanelOpen = !state.isPanelOpen;
    },
    openNotificationPanel: (state) => {
      console.log('[notificationsSlice] Reducer: openNotificationPanel. Current isPanelOpen:', state.isPanelOpen);
      state.isPanelOpen = true;
      console.log('[notificationsSlice] Reducer: openNotificationPanel. New isPanelOpen:', state.isPanelOpen);
    },
    closeNotificationPanel: (state) => {
      console.log('[notificationsSlice] Reducer: closeNotificationPanel. Current isPanelOpen:', state.isPanelOpen);
      state.isPanelOpen = false;
      console.log('[notificationsSlice] Reducer: closeNotificationPanel. New isPanelOpen:', state.isPanelOpen);
    },
    setNotificationsList: (state, action: PayloadAction<Notification[]>) => {
      state.items = action.payload;
    },
    addIncomingNotification: (state, action: PayloadAction<Notification>) => {
      // Add to beginning of list, ensure no duplicates by ID if applicable
      state.items = [action.payload, ...state.items.filter(item => item.id !== action.payload.id)];
      if (!action.payload.read) {
        state.unreadCount += 1;
      }
    },
    setUnreadNotificationCount: (state, action: PayloadAction<number>) => {
      state.unreadCount = action.payload;
    },
    // Internal reducer for optimistic update after marking as read
    notificationRead: (state, action: PayloadAction<number>) => {
      const notificationId = action.payload;
      const itemIndex = state.items.findIndex(item => item.id === notificationId);
      if (itemIndex !== -1 && !state.items[itemIndex].read) {
        state.items[itemIndex].read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    allNotificationsRead: (state) => {
      state.items.forEach(item => item.read = true);
      state.unreadCount = 0;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.notifications;
        state.unreadCount = action.payload.unreadCount;
      })
      .addCase(fetchUserNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(markNotificationAsRead.rejected, (state, action) => {
        // Handle potential error, maybe revert optimistic update if needed
        state.error = action.payload as string;
      })
      .addCase(markAllUserNotificationsAsRead.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const {
  toggleNotificationPanel,
  openNotificationPanel,
  closeNotificationPanel,
  setNotificationsList,
  addIncomingNotification,
  setUnreadNotificationCount,
  notificationRead, // Export for direct dispatch if needed after service call
  allNotificationsRead, // Export for direct dispatch
} = notificationsSlice.actions;

export default notificationsSlice.reducer; 