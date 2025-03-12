import { createContext } from "react";

export interface Project {
  id: number;
  name: string;
}

export interface Organization {
  id: number;
  name: string;
  projects?: Project[];
}

interface AppContextType {
  selectedOrganization: Organization | null;
}

export const AppContext = createContext<AppContextType>({
  selectedOrganization: null,
});
