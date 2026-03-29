import type { User } from "../types/auth";

type MockUserRecord = Omit<User, "token"> & {
  password: string;
};

export const mockUsers: MockUserRecord[] = [
  {
    id: 1,
    email: "rider@directride.com",
    password: "Password123!",
    firstName: "Razzo",
    lastName: "Rider",
    role: "rider",
  },
  {
    id: 2,
    email: "driver@directride.com",
    password: "Password123!",
    firstName: "Jordan",
    lastName: "Driver",
    role: "driver",
  },
  {
    id: 3,
    email: "admin@directride.com",
    password: "Password123!",
    firstName: "Casey",
    lastName: "Admin",
    role: "admin",
  },
];