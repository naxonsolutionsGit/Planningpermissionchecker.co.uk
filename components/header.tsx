import Link from "next/link"
import { ModeToggle } from "@/components/mode-toggle"
import { Phone, Mail } from "lucide-react"

export function Header() {
  return (
    <header className="bg-card border-b border-border shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3">
            {/* <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-md">
              <span className="text-primary-foreground font-bold text-lg">PC</span>
            </div> */}
            <div className="w-10 h-10  from-primary to-accent rounded-xl flex items-center justify-center shadow-md overflow-hidden">
  <img 
    src="/Logo1.PNG" 
    alt="Planning Check Logo" 
    className="w-full h-full object-cover"
  />
</div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-foreground">PlanningCheckers</span>
              <span className="text-xs text-muted-foreground font-medium">.co.uk</span>
            </div>
          </Link>

          <div className="hidden md:flex items-center space-x-6 text-sm text-muted-foreground">
            <div className="flex items-center space-x-2">
              <Phone className="w-4 h-4" />
              <span>0800 123 4567</span>
            </div>
            <div className="flex items-center space-x-2">
              <Mail className="w-4 h-4" />
              <span>info@planningcheckers.co.uk</span>
            </div>
          </div>

          {/* <div className="flex items-center space-x-4">
            <ModeToggle />
          </div> */}
        </div>
      </div>
    </header>
  )
}
