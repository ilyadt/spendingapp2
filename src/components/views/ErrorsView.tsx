import { useConflictVersionStore } from '@src/stores/conflictVersions'
import { format } from 'date-fns'

export function ErrorsView() {
  const store = useConflictVersionStore()

  return (
    <>
      <div>Errors</div>

      <div className="table-responsive" style={{maxWidth: '100%', overflowX: 'auto'}}>
        <table className="table table-bordered table-sm align-middle" style={{tableLayout: 'fixed', minWidth: '700px'}}>
          <thead>
            <tr>
              <th style={{width: '80px'}}>date</th>
              <th style={{width: '115px'}}>spid</th>
              <th style={{width: '55px'}}>ver</th>
              <th style={{width: '35px'}}>bid</th>
              <th style={{width: '210px'}}>change</th>
              <th style={{width: '210px'}}>reason</th>
              <th style={{width: '30px'}}></th>
            </tr>
          </thead>
          <tbody>
            {store.conflictVersionsArr().map((ver) => (
              <tr key={ver.version}>
                <td>{ format(ver.conflictedAt, 'HH:mm:ss dd.MM.yy') }</td>
                <td>{ ver.spendingId }</td>
                <td>{ ver.version }</td>
                <td>{ ver.budgetId }</td>
                <td>{`${ver.from} → ${ver.to}`}</td>
                <td>{ ver.reason }</td>
                <td>
                  <button
                    onClick={() => store.remove(ver.version)}
                    className="btn btn-warning btn-sm p-1 m-1"
                    style={{minWidth: '20px', lineHeight: 1}}
                  >
                  x
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
