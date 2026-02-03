import styles from './StepNav.module.css'

interface Step {
  id: number
  title: string
  shortTitle: string
}

interface StepNavProps {
  steps: Step[]
  currentStep: number
  onStepClick: (stepId: number) => void
}

export default function StepNav({ steps, currentStep, onStepClick }: StepNavProps) {
  return (
    <nav className={styles.nav}>
      <div className={styles.steps}>
        {steps.map((step) => (
          <button
            key={step.id}
            className={`${styles.step} ${currentStep === step.id ? styles.active : ''} ${currentStep > step.id ? styles.completed : ''}`}
            onClick={() => onStepClick(step.id)}
          >
            <span className={styles.stepNumber}>{step.shortTitle}</span>
            <span className={styles.stepTitle}>{step.title}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
