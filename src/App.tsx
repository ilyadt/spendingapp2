import './App.css'
import {Facade} from "@src/facade.ts";
import StatusBar from "@src/components/StatusBar.tsx";
import HomeView from "@src/components/views/HomeView.tsx";
import {NavLink, Route, Routes} from "react-router";
import {BudgetView} from "@src/components/views/BudgetView.tsx";
import {CrossBudgetView} from "@src/components/views/CrossBudgetView.tsx";
import {ErrorsView} from "@src/components/views/ErrorsView.tsx";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faHome} from "@fortawesome/free-solid-svg-icons/faHome";
import clsx from "clsx";

function App() {
  const budgets = Facade.getBudgets()
    .map(b => ({...b, sort: b.sort || 1e6}))
    .sort((a, b) => a.sort - b.sort)

  return (
    <>
      <div className="container">
        <StatusBar/>
        <Routes>
          <Route index element={<HomeView budgets={budgets}/>}/>
          <Route path="budget/:budgetId" element={<BudgetView budgets={budgets}/>}/>
          <Route path="cross-budget" element={<CrossBudgetView budgets={budgets}/>}/>
          <Route path="errors" element={<ErrorsView/>}/>
        </Routes>
      </div>

      <div style={{height: '80px'}}></div>

      { /* Нижняя навигация */}
      <nav className="navbar navbar-custom fixed-bottom navbar-light bg-light border-top nav-scroll p-0">
        <ul className="nav flex-nowrap">
          <li className="btn-style" style={{padding: "0px 5px 0 10px"}}>
            <NavLink
              to="/"
              className={({isActive}) => clsx('nav-link', isActive && 'active')}
            >
              <FontAwesomeIcon icon={faHome}/>
            </NavLink>
          </li>

          <li className="btn-style">
            <NavLink
              to="/cross-budget"
              className={({isActive}) => clsx('nav-link', isActive && 'active')}
            >
              cross
            </NavLink>
          </li>

          {budgets.map((b) => (
            <li key={b.id} className="btn-style">
              <NavLink
                to={`/budget/${b.id}`}
                className={({isActive}) => clsx('nav-link', isActive && 'active')}
              >
                {b.alias}
              </NavLink>
            </li>
          ))}

          <li className="btn-style">
            <NavLink
              to="/errors"
              className={({isActive}) => clsx('nav-link', isActive && 'active')}
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
