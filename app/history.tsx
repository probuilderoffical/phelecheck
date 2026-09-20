import { StyleSheet, Text, View, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { BottomNav } from "@/components/BottomNav";
import { colors, radius, spacing } from "@/theme";

export default function HistoryScreen() {
  const scheme = useColorScheme() === "dark" ? "dark" : "light";
  const c = colors[scheme];
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={["top","left","right"]}>
      <View style={styles.header}><Text style={[styles.title,{color:c.text}]}>History</Text></View>
      <View style={styles.body}>
        <View style={[styles.empty,{backgroundColor:c.surface,borderColor:c.border}]}>
          <View style={[styles.icon,{backgroundColor:c.surfaceMuted}]}><Ionicons name="time-outline" size={27} color={c.text}/></View>
          <Text style={[styles.emptyTitle,{color:c.text}]}>No checks yet</Text>
          <Text style={[styles.emptyText,{color:c.textMuted}]}>Your recent PheleCheck analyses will appear here.</Text>
        </View>
      </View>
      <BottomNav active="history"/>
    </SafeAreaView>
  );
}
const styles=StyleSheet.create({
  safe:{flex:1}, header:{height:64,paddingHorizontal:spacing.lg,justifyContent:"center"}, title:{fontSize:24,fontWeight:"800"},
  body:{flex:1,padding:spacing.lg}, empty:{borderWidth:1,borderRadius:radius.lg,padding:28,alignItems:"center",marginTop:30},
  icon:{width:58,height:58,borderRadius:18,alignItems:"center",justifyContent:"center"}, emptyTitle:{fontSize:18,fontWeight:"800",marginTop:16},
  emptyText:{fontSize:13,lineHeight:19,textAlign:"center",marginTop:6}
});
