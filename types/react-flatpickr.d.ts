declare module "react-flatpickr" {
  import { ComponentType } from "react"
  import { Options } from "flatpickr/dist/types/options"

  export interface FlatpickrProps {
    options?: Options
    value?: any
    onChange?: (selectedDates: Date[], dateStr: string, instance: any) => void
    className?: string
    placeholder?: string
    disabled?: boolean
    [key: string]: any
  }

  const Flatpickr: ComponentType<FlatpickrProps>
  export default Flatpickr
}
