import { User, Mic, Play, Settings } from 'lucide-react'

export function HomePage() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">
          Welcome to Talking Avatar
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Create and interact with AI-powered avatars that can speak, listen, and respond naturally.
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="p-6 border border-border rounded-lg bg-card">
          <User className="h-12 w-12 text-primary mb-4" />
          <h3 className="text-lg font-semibold mb-2">Create Avatars</h3>
          <p className="text-muted-foreground">
            Design custom avatars with unique personalities and appearances.
          </p>
        </div>

        <div className="p-6 border border-border rounded-lg bg-card">
          <Mic className="h-12 w-12 text-primary mb-4" />
          <h3 className="text-lg font-semibold mb-2">Voice Interaction</h3>
          <p className="text-muted-foreground">
            Talk to your avatars and hear them respond with natural speech.
          </p>
        </div>

        <div className="p-6 border border-border rounded-lg bg-card">
          <Settings className="h-12 w-12 text-primary mb-4" />
          <h3 className="text-lg font-semibold mb-2">Customizable</h3>
          <p className="text-muted-foreground">
            Adjust voice settings, personality traits, and visual appearance.
          </p>
        </div>
      </div>

      {/* CTA Section */}
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-semibold">Ready to get started?</h2>
        <div className="flex justify-center space-x-4">
          <a
            href="/register"
            className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            <Play className="h-4 w-4 mr-2" />
            Create Your Avatar
          </a>
          <a
            href="/avatar"
            className="inline-flex items-center px-6 py-3 border border-border rounded-md hover:bg-accent transition-colors"
          >
            View Avatars
          </a>
        </div>
      </div>
    </div>
  )
}
