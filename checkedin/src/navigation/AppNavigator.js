import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "../screens/HomeScreen";
import CreateScreen from "../screens/CreateScreen";
import JoinScreen from "../screens/JoinScreen";
import ChallengeDetailScreen from "../screens/ChallengeDetailScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerStyle: { backgroundColor: "#6C63FF" },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "bold" },
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: "CheckedIn" }} />
      <Stack.Screen name="Create" component={CreateScreen} options={{ title: "New Challenge" }} />
      <Stack.Screen name="Join" component={JoinScreen} options={{ title: "Join Challenge" }} />
      <Stack.Screen name="ChallengeDetail" component={ChallengeDetailScreen} options={{ title: "Challenge" }} />
    </Stack.Navigator>
  );
}