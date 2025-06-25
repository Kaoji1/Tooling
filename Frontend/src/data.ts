import { test } from "./app/shared/models/test";

export const sample_test: test[]=[
  Object.assign(new test(), { id: '1', name: 'Fluk', role: 'Admin' }),
  Object.assign(new test(), { id: '2', name: 'Zaza', role: 'User' }),
  Object.assign(new test(), { id: '3', name: 'Krit', role: 'Guest' })
];
