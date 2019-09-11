import React from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';
import SiteNav from './siteNav';
import Home from './home';
import HooksDemo from './hooksDemo';

const App = () => (
  <div>
    <SiteNav />
    <main>
      <Switch>
        <Route exact path="/" component={Home} />
        <Route path="/home">
          <Redirect to="/" />
        </Route>
        <Route path="/hooks" component={HooksDemo} />
      </Switch>
    </main>
  </div>
);

export default App;
