import {createContext} from "react";
import type {BudgetsWithSpentById} from "@src/stores/budgets.ts";

export const BudgetsContext = createContext<BudgetsWithSpentById>({});
