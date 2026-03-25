import React from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'

const AuthStatusDemo: React.FC = () => {
  const { user, session, loading, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading authentication status...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Global Authentication State Demo</h1>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Auth Status Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Authentication Status
                  <Badge variant={user ? "default" : "secondary"}>
                    {user ? "Authenticated" : "Not Authenticated"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {user ? (
                  <div className="space-y-2">
                    <p><strong>Email:</strong> {user.email}</p>
                    <p><strong>User ID:</strong> {user.id}</p>
                    <p><strong>Created:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
                    <Button onClick={handleSignOut} variant="outline">
                      Sign Out
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-muted-foreground">No user is currently authenticated.</p>
                    <div className="flex gap-2">
                      <Button asChild>
                        <a href="/login">Login</a>
                      </Button>
                      <Button asChild variant="outline">
                        <a href="/signup">Sign Up</a>
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Session Info Card */}
            <Card>
              <CardHeader>
                <CardTitle>Session Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {session ? (
                  <div className="space-y-2">
                    <p><strong>Access Token:</strong> {session.access_token ? "Present" : "None"}</p>
                    <p><strong>Refresh Token:</strong> {session.refresh_token ? "Present" : "None"}</p>
                    <p><strong>Expires At:</strong> {new Date(session.expires_at! * 1000).toLocaleString()}</p>
                    <p><strong>Token Type:</strong> {session.token_type}</p>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No active session.</p>
                )}
              </CardContent>
            </Card>

            {/* Usage Instructions Card */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>How to Use Global Auth State</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-semibold">1. Import the hook:</h3>
                  <code className="block bg-muted p-2 rounded text-sm">
                    import {'{'} useAuth {'}'} from '@/hooks/use-auth'
                  </code>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold">2. Use in any component:</h3>
                  <code className="block bg-muted p-2 rounded text-sm">
                    const {'{'} user, loading, signIn, signOut {'}'} = useAuth()
                  </code>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold">3. Available properties:</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li><code>user</code> - Current user object or null</li>
                    <li><code>session</code> - Current session object or null</li>
                    <li><code>loading</code> - Boolean indicating auth state loading</li>
                    <li><code>signUp(email, password)</code> - Sign up function</li>
                    <li><code>signIn(email, password)</code> - Sign in function</li>
                    <li><code>signOut()</code> - Sign out function</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold">4. Protected Routes:</h3>
                  <code className="block bg-muted p-2 rounded text-sm">
                    &lt;Route path="/protected" element=&#123;&lt;ProtectedRoute&gt;&lt;MyComponent /&gt;&lt;/ProtectedRoute&gt;&#125; /&gt;
                  </code>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default AuthStatusDemo