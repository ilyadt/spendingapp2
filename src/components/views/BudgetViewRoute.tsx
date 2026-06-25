import {useParams} from "react-router";
import {useBudgetsWithSpent} from "@/stores/budgets.ts";
import {BudgetView} from "@/components/views/BudgetView.tsx";

export function BudgetViewRoute() {
  const { budgetId } = useParams()

  const budget = useBudgetsWithSpent(s => s.budgets[Number(budgetId)])
  if (!budget) {
    return <div>Budget {budgetId} not found</div>
  }

  return <BudgetView key={budgetId} budget={budget}/>
}
