import { Redirect } from 'expo-router';

export default function Index() {
  // The root layout handles the session logic and redirects
  // This index file acts as a landing point that triggers the layout effect
  return <Redirect href="/auth" />;
}
