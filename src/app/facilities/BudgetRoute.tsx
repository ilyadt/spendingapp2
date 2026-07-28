import {useParams} from "react-router";
import {BudgetScreen} from "@/app/screens/BudgetScreen.tsx";
import {use} from "react";
import {BudgetsContext} from "@/models/contexts.ts";

export function BudgetRoute() {
  const { budgetId } = useParams()
  const budgets = use(BudgetsContext)

  const budget = budgets[Number(budgetId)]
  if (!budget) {
    return <div>Budget {budgetId} not found</div>
  }

  return <BudgetScreen key={budgetId} budget={budget}/>
}
