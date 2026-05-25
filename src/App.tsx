import StatusBar from "@src/components/StatusBar.tsx";
import HomeView from "@src/components/views/HomeView.tsx";
import {NavLink, Route, Routes} from "react-router";
import {CrossBudgetView} from "@src/components/views/CrossBudgetView.tsx";
import {ErrorsView} from "@src/components/views/ErrorsView.tsx";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faHome} from "@fortawesome/free-solid-svg-icons/faHome";
import clsx from "clsx";
import styles from './App.module.css'
import {useBudgetsWithSpent} from "@src/stores/budgets.ts";
import {BudgetViewRoute} from "@src/components/views/BudgetViewRoute.tsx";
import {budgetsSortFn} from "@src/helpers/helper.ts";

function App() {
  const budgets = Object.values(useBudgetsWithSpent(s => s.budgets)).sort(budgetsSortFn)

  return (
    <>
      <div className="container">
        <StatusBar/>
        <Routes>
          <Route index element={<HomeView />}/>
          <Route path="budget/:budgetId" element={<BudgetViewRoute />}/>
          <Route path="cross-budget" element={<CrossBudgetView />}/>
          <Route path="errors" element={<ErrorsView/>}/>
        </Routes>
      </div>

      <div style={{height: '80px'}}></div>

      { /* Нижняя навигация */}
      <nav className={`${styles.navbarCustom} fixed-bottom navbar-light bg-light border-top ${styles.navScroll} p-0`}>
        <ul className="nav flex-nowrap">
          <li className={ styles.btnStyle }>
            <NavLink
              to="/"
              style={{padding: "0px 5px 0 10px"}}
              className={({isActive}) => clsx(styles.navLink, isActive && styles.active)}
            >
              <FontAwesomeIcon icon={faHome}/>
            </NavLink>
          </li>

          <li className={ styles.btnStyle }>
            <NavLink
              to="/cross-budget"
              className={({isActive}) => clsx(styles.navLink, isActive && styles.active)}
            >
              cross
            </NavLink>
          </li>

          {budgets.map((b) => (
            <li key={b.id} className={ styles.btnStyle }>
              <NavLink
                to={`/budget/${b.id}`}
                className={({isActive}) => clsx(styles.navLink, isActive && styles.active)}
              >
                {b.alias}
              </NavLink>
            </li>
          ))}

          <li className={ [styles.btnStyle, styles.navItemLast].join(' ') }>
            <NavLink
              to="/errors"
              className={({isActive}) => clsx(styles.navLink, isActive && styles.active)}
            >
              Errs
            </NavLink>
          </li>
        </ul>
      </nav>
    </>
  )
}

export default App
