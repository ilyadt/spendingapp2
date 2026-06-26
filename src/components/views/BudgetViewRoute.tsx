import {useParams} from "react-router";
import {BudgetView} from "@/components/views/BudgetView.tsx";
import {useContext} from "react";
import {BudgetsContext} from "@/models/contexts.ts";

export function BudgetViewRoute() {
  const { budgetId } = useParams()
  const budgets = useContext(BudgetsContext)

  const budget = budgets[Number(budgetId)]
  if (!budget) {
    return <div>Budget {budgetId} not found</div>
  }

  return <BudgetView key={budgetId} budget={budget}/>
}
