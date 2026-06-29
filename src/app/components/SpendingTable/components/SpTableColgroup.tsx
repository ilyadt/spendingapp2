
export default function SpTableColgroup({crossBudget}: {crossBudget: boolean}) {
  return crossBudget ? (
    <colgroup>
      <col style={{width: '15%'}}/>
      <col style={{width: '45%'}}/>
      <col style={{width: '18%'}}/>
      <col style={{width: '20%'}}/>
    </colgroup>
  ) : (
    <colgroup>
      <col style={{width: '21%'}}/>
      <col style={{width: '58%'}}/>
      <col style={{width: '21%'}}/>
    </colgroup>
  )
}
