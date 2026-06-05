import { useStatusStore } from '@src/stores/status'
import { useConflictVersionStore } from '@src/stores/conflictVersions'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSync } from '@fortawesome/free-solid-svg-icons'
import styles from './StatusBar.module.css'

export default function StatusBar() {
    const statusGetSpendings = useStatusStore(s => s.statusGetSpendings)
    const statusUpdateSpendings = useStatusStore(s => s.statusUpdateSpendings)
    const pendingEvents = useStatusStore(s => s.pendingEvents)

    const conflictVersionsNum = Object.values(
      useConflictVersionStore(s => s.conflictVersions)
    ).length

    function reload() {
        window.location.reload()
    }

    const bg =
        conflictVersionsNum > 0
            ? '#ea4747'
            : pendingEvents > 0
                ? '#fae5bb'
                : 'rgb(248 249 250)'

    const bgGet =
        statusGetSpendings !== 'ok'
            ? '#fae5bb'
            : 'rgb(248 249 250)'

    return (
        <div className={`row ${styles.statusBar}`} style={{backgroundColor: bg}}>
            <div className={`col-3`} style={{backgroundColor: bgGet}}>
                G: {statusGetSpendings}
            </div>

            <div className={`col-3`}>
                U: {statusUpdateSpendings}
            </div>

            <div className={`col-2`}>
                P: {pendingEvents}
            </div>

            <div className={`col-2`}>
                E: {conflictVersionsNum}
            </div>

            <div className={`col-2`}>
                <button onClick={reload} className="btn btn-small btn-info p-0">
                    <FontAwesomeIcon
                        icon={faSync}
                        style={{paddingLeft: 3, paddingRight: 3}}
                    />
                </button>
            </div>
        </div>
    )
}
