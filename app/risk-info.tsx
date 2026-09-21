import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { spacing } from "@/theme";
import { useAppTheme } from "@/providers/AppPreferences";

export default function RiskInfo(){
 const {colors:c}=useAppTheme();
 return <SafeAreaView style={[styles.safe,{backgroundColor:c.background}]} edges={["top","left","right","bottom"]}>
  <View style={styles.header}><Pressable onPress={()=>router.back()} style={styles.icon}><Ionicons name="arrow-back" size={23} color={c.text}/></Pressable><Text style={[styles.headerTitle,{color:c.text}]}>Risk scores</Text><View style={styles.icon}/></View>
  <ScrollView contentContainerStyle={styles.body}>
   <Text style={[styles.title,{color:c.text}]}>Evidence first, label second.</Text>
   <Text style={[styles.p,{color:c.textMuted}]}>Sentinel-1 combines the content you submit with available fraud signals. Link checks may include live URL Scanner evidence. A website having no malicious record is not treated as proof of safety.</Text>
   <Text style={[styles.h,{color:c.text}]}>Low Risk · 0–24</Text><Text style={[styles.p,{color:c.textMuted}]}>No meaningful fraud indicators found in the supplied evidence. Still verify important transactions independently.</Text>
   <Text style={[styles.h,{color:c.text}]}>Caution · 25–59</Text><Text style={[styles.p,{color:c.textMuted}]}>Some warning signs exist, but the evidence is incomplete or not strong enough for High Risk.</Text>
   <Text style={[styles.h,{color:c.text}]}>High Risk · 60–100</Text><Text style={[styles.p,{color:c.textMuted}]}>Multiple strong, independent indicators are present, or the content explicitly requests highly sensitive credentials such as an OTP, PIN, password, CVV, seed phrase, or private key.</Text>
   <Text style={[styles.h,{color:c.text}]}>Unable to verify</Text><Text style={[styles.p,{color:c.textMuted}]}>The evidence is too limited, unreadable, or unavailable for a useful assessment.</Text>
  </ScrollView>
 </SafeAreaView>
}
const styles=StyleSheet.create({safe:{flex:1},header:{minHeight:62,paddingHorizontal:spacing.lg,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},icon:{width:40,height:40,alignItems:"center",justifyContent:"center"},headerTitle:{fontSize:17,fontWeight:"800"},body:{paddingHorizontal:spacing.lg,paddingBottom:40},title:{fontSize:30,fontWeight:"800",letterSpacing:-1,marginTop:18,marginBottom:18},h:{fontSize:16,fontWeight:"800",marginTop:20,marginBottom:6},p:{fontSize:14,lineHeight:22}});