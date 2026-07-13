import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faFloppyDisk} from "@fortawesome/free-solid-svg-icons";
import {createSpendingFormData} from "@/models/spendingFormData.ts";
import type {Budget, SpendingRow} from "@/models/models.ts";
import {genRandInt, submitFormData} from "@/helpers/helper.ts";
import {useContext} from "react";
import {SpendingActionsContext} from "@/models/contexts.ts";
import {buildCreateSpObj} from "@/helpers/spendingBuilder.ts";

type Props = {
  onCreate(sp: SpendingRow): void
  budget: Budget
}

export default function AddSpendingForm({onCreate, budget}: Props) {
  const spendingsActions = useContext(SpendingActionsContext)

  function onSubmit(formData: FormData) {
    const spFormData = createSpendingFormData(formData, {[budget.id]: budget})

    const err = spFormData.validate()
    if (err) {
      alert(err)
      return false
    }

    const spending = buildCreateSpObj(spFormData.data, new Date())

    spendingsActions.createSpending(budget.id, spending)

    const newSpRow: SpendingRow = {
      ...spending,
      rowId: genRandInt(),
      budgetId: budget.id,
    }

    onCreate(newSpRow)

    setTimeout(() => { alert('Сохранено!') }, 0)
  }

  return (
    <form className="d-flex align-items-center gap-1 mb-5" onSubmit={submitFormData(onSubmit)}>
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
