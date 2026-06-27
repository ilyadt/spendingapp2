import StatusBar from "@/components/StatusBar.tsx";
import HomeView from "@/components/views/HomeView.tsx";
import {NavLink, type NavLinkRenderProps, Route, Routes} from "react-router";
import {CrossBudgetView} from "@/components/views/CrossBudgetView.tsx";
import {ErrorsView} from "@/components/views/ErrorsView.tsx";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faHome} from "@fortawesome/free-solid-svg-icons/faHome";
import clsx from "clsx/lite";
import styles from './App.module.css'
import {BudgetRoute} from "./components/facilities/BudgetRoute.tsx";
import {budgetsSortFn} from "@/helpers/helper.ts";
import {BudgetsContext} from "@/models/contexts.ts";
import {useContext} from "react";

export default function App() {
  const budgets = useContext(BudgetsContext)

  return (
    <BudgetsContext value={budgets}>
      <div className="container">
        <StatusBar/>
        <Routes>
          <Route index element={<HomeView/>}/>
          <Route path="budget/:budgetId" element={<BudgetRoute/>}/>
          <Route path="cross-budget" element={<CrossBudgetView/>}/>
          <Route path="errors" element={<ErrorsView/>}/>
        </Routes>
      </div>

      <div style={{height: '80px'}}></div>

      { /* Нижняя навигация */}
      <nav className={`${styles.navbarCustom} fixed-bottom navbar-light bg-light border-top ${styles.navScroll} p-0`}>
        <ul className="nav flex-nowrap">
          <li className={styles.btnStyle}>
            <NavLink to="/" style={{padding: "0px 5px 0 10px"}} className={navLinkClass}>
              <FontAwesomeIcon icon={faHome}/>
            </NavLink>
          </li>

          <li className={styles.btnStyle}>
            <NavLink to="/cross-budget" className={navLinkClass}>
              cross
            </NavLink>
          </li>

          {Object.values(budgets).sort(budgetsSortFn).map((b) => (
            <li key={b.id} className={styles.btnStyle}>
              <NavLink to={`/budget/${b.id}`} className={navLinkClass}>
                {b.alias}
              </NavLink>
            </li>
          ))}

          <li className={clsx(styles.btnStyle, styles.navItemLast)}>
            <NavLink to="/errors" className={navLinkClass}>
              Errs
            </NavLink>
          </li>
        </ul>
      </nav>
    </BudgetsContext>
  )
}

function navLinkClass({isActive}: NavLinkRenderProps): string {
  return clsx(styles.navLink, isActive && styles.active)
}
