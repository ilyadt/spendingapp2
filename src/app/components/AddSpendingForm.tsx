import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faFloppyDisk} from "@fortawesome/free-solid-svg-icons";
import {createSpendingFormData} from "@/models/spendingFormData.ts";
import type {Budget, SpendingRow} from "@/models/models.ts";
import {genRandInt} from "@/helpers/helper.ts";
import {useContext, type SubmitEvent} from "react";
import {SpendingActionsContext} from "@/models/contexts.ts";

type Props = {
  onCreate(sp: SpendingRow): void
  budget: Budget
}

export default function AddSpendingForm({onCreate, budget}: Props) {
  const spendingsActions = useContext(SpendingActionsContext)

  function onSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault()

    const form = e.currentTarget
    const formData = createSpendingFormData(new FormData(form), {[budget.id]: budget})

    const err = formData.validate()
    if (err) {
      alert(err)
      return
    }

    const spending = spendingsActions.createSpending(formData.data, new Date())

    const newSpRow: SpendingRow = {
      ...spending,
      rowId: genRandInt(),
      budgetId: budget.id,
    }

    onCreate(newSpRow)

    // clear form
    form.reset()

    setTimeout(() => { alert('Сохранено!') }, 0)
  }

  return (
    <form className="d-flex align-items-center gap-1 mb-5" onSubmit={onSubmit}>
      <input type="hidden" name="budgetId" value={budget.id}/>
      <input
        type="date"
        name="date"
        className="form-control form-control-sm p-1"
        placeholder="дата"
        style={{width: '16ch'}}
      />
      <input
        type="number"
        name="amount"
        className="form-control form-control-sm cell-input text-end p-1"
        placeholder="сумма"
        style={{width: '10ch'}}
      />
      <input
        type="text"
        name="description"
        className="form-control form-control-sm flex-grow-1 p-1"
        placeholder="описание"
      />
      <button className="btn btn-warning btn-sm">
        <FontAwesomeIcon icon={faFloppyDisk}/>
      </button>
    </form>
  )
}
