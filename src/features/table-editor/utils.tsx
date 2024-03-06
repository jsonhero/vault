import { 
  BookAIcon,
  AlignLeftIcon,
  HashIcon,
  ToggleLeftIcon,
  LucideProps 
} from 'lucide-react'


export function columnTypeToIcon(type: string, props: LucideProps) {
  switch (type) {
    case 'text':
      return <AlignLeftIcon {...props} />
    case 'boolean':
      return <ToggleLeftIcon {...props} />
    case 'number':
      return <HashIcon {...props} />
    case 'title':
      return <BookAIcon {...props} />
    default:
      return null
  }
}
