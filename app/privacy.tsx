import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { spacing } from "@/theme";
import { useAppTheme } from "@/providers/AppPreferences";

export default function PrivacyScreen(){
  const {colors:c}=useAppTheme();
  return <SafeAreaView style={[styles.safe,{backgroundColor:c.background}]} edges={["top","left","right","bottom"]}>
    <View style={styles.header}><Pressable onPress={()=>router.back()} style={styles.icon}><Ionicons name="arrow-back" size={23} color={c.text}/></Pressable><Text style={[styles.headerTitle,{color:c.text}]}>Privacy & security</Text><View style={styles.icon}/></View>
    <ScrollView contentContainerStyle={styles.body}>
      <Text style={[styles.title,{color:c.text}]}>Your data should stay yours.</Text>
      <Text style={[styles.p,{color:c.textMuted}]}>PheleCheck sends the content you choose to check to its fraud-analysis backend. Screenshots and QR images are processed for the current check and are not stored as uploaded files by PheleCheck.</Text>
      <Text style={[styles.h,{color:c.text}]}>History and account data</Text>
      <Text style={[styles.p,{color:c.textMuted}]}>Local history and memory can be turned off in Settings. Signed-in users may sync check results and preferences to PheleCheck's backend. Raw screenshot files are not stored in check history.</Text>
      <Text style={[styles.h,{color:c.text}]}>Improve PheleCheck</Text>
      <Text style={[styles.p,{color:c.textMuted}]}>This is off by default for new users. If you turn it on, only reviewed, de-identified check metadata may enter a training-candidate queue. Direct user IDs and source-check links are not retained in new training candidates.</Text>
      <Text style={[styles.h,{color:c.text}]}>Third-party processing</Text>
      <Text style={[styles.p,{color:c.textMuted}]}>Fraud analysis currently uses Cloudflare-hosted AI and may use Cloudflare URL Scanner evidence for links. Never submit passwords, OTPs, PINs, CVV codes, private keys, seed phrases, or full card numbers.</Text>
      <Text style={[styles.h,{color:c.text}]}>Limits</Text>
      <Text style={[styles.p,{color:c.textMuted}]}>Risk results are guidance, not a guarantee. PheleCheck can be wrong, and absence of a malicious web record does not prove a website is safe.</Text>
    </ScrollView>
  </SafeAreaView>
}
const styles=StyleSheet.create({safe:{flex:1},header:{minHeight:62,paddingHorizontal:spacing.lg,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},icon:{width:40,height:40,alignItems:"center",justifyContent:"center"},headerTitle:{fontSize:17,fontWeight:"800"},body:{paddingHorizontal:spacing.lg,paddingBottom:40},title:{fontSize:30,fontWeight:"800",letterSpacing:-1,marginTop:18,marginBottom:18},h:{fontSize:16,fontWeight:"800",marginTop:20,marginBottom:6},p:{fontSize:14,lineHeight:22}});