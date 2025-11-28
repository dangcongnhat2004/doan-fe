import { createSlice } from "@reduxjs/toolkit";

type AppState = {
  count: number;
};

const initialState: AppState = {
  count: 0,
};

export const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    increment: (state) => {
      state.count += 1;
    },
    reset: (state) => {
      state.count = 0;
    },
  },
});

export const { increment, reset } = appSlice.actions;

export default appSlice.reducer;
