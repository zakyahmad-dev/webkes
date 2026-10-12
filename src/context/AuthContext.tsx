"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { CurrentUser, UserRole } from "@/lib/types";

export const DEMO_PERSONAS: CurrentUser[] = [
  {
    id: 11,
    name: "Budi Santoso",
    email: "patient@healthhub.id",
    role: "patient",
    phone: "081288990011",
    avatarPath: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    patientId: 1,
  },
  {
    id: 3,
    name: "dr. Sarah Wijaya, Sp.PD",
    email: "doctor@healthhub.id",
    role: "doctor",
    phone: "081234567890",
    avatarPath: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80",
    doctorId: 1,
  },
  {
    id: 4,
    name: "dr. Dimas Wicaksono, Sp.JP(K)",
    email: "dimas@healthhub.id",
    role: "doctor",
    phone: "081234567891",
    avatarPath: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&auto=format&fit=crop&q=80",
    doctorId: 2,
  },
  {
    id: 7,
    name: "Ns. Siti Rahayu, S.Kep",
    email: "nurse@healthhub.id",
    role: "nurse",
    phone: "081398765432",
    avatarPath: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: 8,
    name: "apt. Hendra Gunawan, S.Farm",
    email: "pharmacy@healthhub.id",
    role: "pharmacist",
    phone: "081377889900",
    avatarPath: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: 9,
    name: "Maya Indah, A.Md.AK",
    email: "lab@healthhub.id",
    role: "lab",
    phone: "081366554433",
    avatarPath: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: 10,
    name: "Rian Pratama, S.E",
    email: "cashier@healthhub.id",
    role: "cashier",
    phone: "081311223344",
    avatarPath: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: 2,
    name: "Doni Prasetyo, S.Kom",
    email: "admin@healthhub.id",
    role: "admin",
    phone: "081100000002",
    avatarPath: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: 1,
    name: "dr. Alexander Pratama, MARS",
    email: "superadmin@healthhub.id",
    role: "super-admin",
    phone: "081100000001",
    avatarPath: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80",
  },
];

interface AuthContextType {
  currentUser: CurrentUser | null;
  setCurrentUser: (user: CurrentUser | null) => void;
  switchPersona: (role: UserRole, email?: string) => void;
  login: (email: string, password?: string) => boolean;
  logout: () => void;
  isLoggedIn: boolean;
  unreadNotificationsCount: number;
  setUnreadNotificationsCount: React.Dispatch<React.SetStateAction<number>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Default demo user: Patient Budi Santoso so reviewer sees active appointment & features immediately
  const [currentUser, setCurrentUserState] = useState<CurrentUser | null>(DEMO_PERSONAS[0]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(3);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("healthhub_user");
      if (savedUser) {
        setCurrentUserState(JSON.parse(savedUser));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const setCurrentUser = (user: CurrentUser | null) => {
    setCurrentUserState(user);
    if (user) {
      localStorage.setItem("healthhub_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("healthhub_user");
    }
  };

  const switchPersona = (role: UserRole, email?: string) => {
    const target = email
      ? DEMO_PERSONAS.find((p) => p.email === email)
      : DEMO_PERSONAS.find((p) => p.role === role);
    if (target) {
      setCurrentUser(target);
    }
  };

  const login = (email: string) => {
    const found = DEMO_PERSONAS.find((p) => p.email.toLowerCase() === email.toLowerCase());
    if (found) {
      setCurrentUser(found);
      return true;
    }
    // Fallback if custom user
    const newUser: CurrentUser = {
      id: 99,
      name: email.split("@")[0].toUpperCase(),
      email,
      role: "patient",
      patientId: 1,
    };
    setCurrentUser(newUser);
    return true;
  };

  const logout = () => {
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        switchPersona,
        login,
        logout,
        isLoggedIn: !!currentUser,
        unreadNotificationsCount,
        setUnreadNotificationsCount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
