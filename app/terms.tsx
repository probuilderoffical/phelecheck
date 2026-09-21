import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { spacing } from "@/theme";
import { useAppTheme } from "@/providers/AppPreferences";

export default function TermsScreen(){
  const {colors:c}=useAppTheme();
  return <SafeAreaView style={[styles.safe,{backgroundColor:c.background}]} edges={["top","left","right","bottom"]}>
    <View style={styles.header}><Pressable onPress={()=>router.back()} style={styles.icon}><Ionicons name="arrow-back" size={23} color={c.text}/></Pressable><Text style={[styles.headerTitle,{color:c.text}]}>Terms & safety</Text><View style={styles.icon}/></View>
    <ScrollView contentContainerStyle={styles.body}>
      <Text style={[styles.title,{color:c.text}]}>Use PheleCheck as a safety aid.</Text>
      <Text style={[styles.p,{color:c.textMuted}]}>PheleCheck provides automated fraud-risk guidance based on the content and evidence available at the time of a check. Results are not legal, financial, law-enforcement, or identity-verification decisions.</Text>
      <Text style={[styles.h,{color:c.text}]}>No safety guarantee</Text>
      <Text style={[styles.p,{color:c.textMuted}]}>A Low Risk result does not guarantee that a person, payment, message, website, or transaction is legitimate. A High Risk result is a warning based on detected evidence, not a declaration that someone is a criminal.</Text>
      <Text style={[styles.h,{color:c.text}]}>Your responsibility</Text>
      <Text style={[styles.p,{color:c.textMuted}]}>For important payments, independently verify the recipient through official contact details you find yourself. Never rely on PheleCheck as the sole basis for sending money or disclosing sensitive information.</Text>
      <Text style={[styles.h,{color:c.text}]}>Prohibited submissions</Text>
      <Text style={[styles.p,{color:c.textMuted}]}>Do not submit passwords, OTPs, PINs, CVV codes, full card numbers, private keys, seed phrases, or content you are not permitted to share.</Text>
      <Text style={[styles.h,{color:c.text}]}>Service availability</Text>
      <Text style={[styles.p,{color:c.textMuted}]}>AI, web-evidence, and network services can be unavailable or incomplete. PheleCheck may fall back to limited local analysis when cloud analysis cannot be reached.</Text>
    </ScrollView>
  </SafeAreaView>
}
const styles=StyleSheet.create({safe:{flex:1},header:{minHeight:62,paddingHorizontal:spacing.lg,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},icon:{width:40,height:40,alignItems:"center",justifyContent:"center"},headerTitle:{fontSize:17,fontWeight:"800"},body:{paddingHorizontal:spacing.lg,paddingBottom:40},title:{fontSize:30,fontWeight:"800",letterSpacing:-1,marginTop:18,marginBottom:18},h:{fontSize:16,fontWeight:"800",marginTop:20,marginBottom:6},p:{fontSize:14,lineHeight:22}});