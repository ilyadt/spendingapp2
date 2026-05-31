import { useStatusStore } from '@src/stores/status'
import { useConflictVersionStore } from '@src/stores/conflictVersions'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSync } from '@fortawesome/free-solid-svg-icons'
import styles from './StatusBar.module.css'

export default function StatusBar() {
    const statusGetSpendings = useStatusStore(s => s.statusGetSpendings)
    const statusUpdateSpendings = useStatusStore(s => s.statusUpdateSpendings)
    const pendingEvents = useStatusStore(s => s.pendingEvents)

    const conflictVersions = Object.values(
      useConflictVersionStore(s => s.conflictVersions)
    )

    function reload() {
        window.location.reload()
    }

    const bg =
        conflictVersions.length > 0
            ? '#ea4747'
            : pendingEvents > 0
                ? '#fae5bb'
                : 'rgb(248 249 250)'

    const bgGet =
        statusGetSpendings !== 'ok'
            ? '#fae5bb'
            : 'rgb(248 249 250)'

    return (
        <div className={`row ${styles.fixedRow}`} style={{backgroundColor: bg, position: 'sticky', top: 0, zIndex: 1000}}>
            <div className={`col-3 ${styles.textTruncate}`} style={{backgroundColor: bgGet}}>
                G: {statusGetSpendings}
            </div>

            <div className={`col-3 ${styles.textTruncate}`}>
                U: {statusUpdateSpendings}
            </div>

            <div className={`col-2 ${styles.textTruncate}`}>
                P: {pendingEvents}
            </div>

            <div className={`col-2 ${styles.textTruncate}`}>
                E: {conflictVersions.length}
            </div>

            <div className={`col-2 ${styles.textTruncate}`}>
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
