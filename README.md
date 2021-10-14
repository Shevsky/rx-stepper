# Stepper with RxJS

Сервис для осуществления пошагового прохождения процессов

## Установка

>npm i rx-stepper
>
>yarn add rx-stepper

## Использование

### CommonStepperService

```typescript jsx
import React, { Component } from 'react';
import { CommonStepperService, IStepperActions, IStepperInterface } from 'rx-stepper';

enum FLOW_STEP {
  FORM = 'form',
  CONFIRMATION = 'confirmation',
  RESULT = 'result'
}

type TFlowState = {
  step: FLOW_STEP;
  actions: IStepperActions;
}

class Flow extends Component<object, TFlowState> {
  stepper: IStepperInterface<FLOW_STEP>;

  constructor(props: object) {
    super(props);

    this.stepper = new CommonStepperService<FLOW_STEP>({
      steps: [FLOW_STEP.FORM, FLOW_STEP.CONFIRMATION, FLOW_STEP.RESULT],
      defaultStep: FLOW_STEP.FORM,
      onPendingStep(step: FLOW_STEP, currentStep: T): Promise<void> {
        if (currentStep === FLOW_STEP.FORM) {
          return this.validateForm();
        }

        return Promise.resolve();
      }
    });

    this.state = { step: this.stepper.currentStep, actions: this.stepper.currentActions };
  }

  componentDidMount(): void {
    this.stepper.currentStep$.subscribe((step: FLOW_STEP): void => this.setState({step}));
    this.stepper.currentActions$.subscribe((actions: IStepperActions): void => this.setState({actions}));
  }

  private async validateForm(): Promise<void> {
    return Promise.resolve();
  }

  render(): JSX.Element {
    return (
      <div>
        {this.state.step === FLOW_STEP.FORM && (
          <Form/>
        )}

        {this.state.step === FLOW_STEP.CONFIRMATION && (
          <Confirmation/>
        )}

        {this.state.step === FLOW_STEP.RESULT && (
          <Result/>
        )}

        {!!this.state.actions.goBack && (
          <button type="button" onClick={this.state.actions.goBack}>
            Назад
          </button>
        )}

        {!!this.state.actions.goForward && (
          <button type="button" onClick={this.state.actions.goForward}>
            Вперед
          </button>
        )}
      </div>
    );
  }
}
```

### RouteStepperService

```typescript jsx
import { createBrowserHistory } from 'history';
import React, { Component } from 'react';
import { generatePath, matchPath } from 'react-router';
import { IStepperActions, IStepperInterface, RouteStepperService } from 'rx-stepper';

class FlowWithRouter extends Flow {
  stepper: IStepperInterface<FLOW_STEP>;

  constructor(props: object) {
    super(props);

    this.stepper = new RouteStepperService<FLOW_STEP>({
      steps: [FLOW_STEP.FORM, FLOW_STEP.CONFIRMATION, FLOW_STEP.RESULT],
      defaultStep: FLOW_STEP.FORM,
      route: '/flow/:step?',
      history: createBrowserHistory(),
      matcher: {
        matchPath: matchPath,
        generatePath: generatePath
      }
    });

    this.state = { step: this.stepper.currentStep, actions: this.stepper.currentActions };
  }
}
```