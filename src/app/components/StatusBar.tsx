import {useStatusStore} from '@/stores/status'
import {useConflictVersionStore} from '@/stores/conflictVersions'
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'
import {faSync} from '@fortawesome/free-solid-svg-icons'
import styles from './StatusBar.module.css'

export default function StatusBar() {
  const statusState = useStatusStore()
  const conflictVersions = useConflictVersionStore(s => s.conflictVersions)

  const conflictVersionsNum = Object.values(conflictVersions).length

  const bg = conflictVersionsNum > 0
    ? '#ea4747'
    : statusState.pendingEvents > 0
      ? '#fae5bb'
      : 'rgb(248 249 250)'

  const bgGet = statusState.statusGetSpendings !== 'ok' ? '#fae5bb' : 'rgb(248 249 250)'

  return (
    <div className={`row ${styles.statusBar}`} style={{backgroundColor: bg}}>
      <div className={`col-3`} style={{backgroundColor: bgGet}}>
        G: {statusState.statusGetSpendings}
      </div>

      <div className={`col-3`}>
        U: {statusState.statusUpdateSpendings}
      </div>

      <div className={`col-2`}>
        P: {statusState.pendingEvents}
      </div>

      <div className={`col-2`}>
        E: {conflictVersionsNum}
      </div>

      <div className={`col-2`}>
        <button onClick={() => window.location.reload()} className="btn btn-small btn-info p-0">
          <FontAwesomeIcon icon={faSync} style={{paddingLeft: 3, paddingRight: 3}}/>
        </button>
      </div>
    </div>
  )
}
