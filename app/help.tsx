import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { spacing } from "@/theme";
import { useAppTheme } from "@/providers/AppPreferences";

export default function HelpScreen(){
  const {colors:c}=useAppTheme();
  return <SafeAreaView style={[styles.safe,{backgroundColor:c.background}]} edges={["top","left","right","bottom"]}>
    <View style={styles.header}>
      <Pressable onPress={()=>router.back()} style={styles.icon}><Ionicons name="arrow-back" size={23} color={c.text}/></Pressable>
      <Text style={[styles.headerTitle,{color:c.text}]}>Help center</Text>
      <View style={styles.icon}/>
    </View>
    <ScrollView contentContainerStyle={styles.body}>
      <Text style={[styles.title,{color:c.text}]}>How to use PheleCheck</Text>
      <Text style={[styles.h,{color:c.text}]}>Message or link</Text>
      <Text style={[styles.p,{color:c.textMuted}]}>Paste the exact suspicious text or URL. Include context such as what the sender wants you to do, but remove passwords, OTPs, PINs, CVV codes and full card numbers.</Text>
      <Text style={[styles.h,{color:c.text}]}>Screenshot</Text>
      <Text style={[styles.p,{color:c.textMuted}]}>Upload a clear screenshot where important text is readable. Sentinel-1 can inspect image and text evidence together.</Text>
      <Text style={[styles.h,{color:c.text}]}>QR code</Text>
      <Text style={[styles.p,{color:c.textMuted}]}>Upload a clear QR image. PheleCheck will only report an encoded destination when the model can reliably read it; otherwise the result should say it cannot verify the QR content.</Text>
      <Text style={[styles.h,{color:c.text}]}>If a result looks wrong</Text>
      <Text style={[styles.p,{color:c.textMuted}]}>Do not rely on the score alone. Verify through official channels and use Report to send a suspicious case for review.</Text>
      <Pressable onPress={()=>router.push("/report")} style={[styles.button,{backgroundColor:c.text}]}>
        <Text style={[styles.buttonText,{color:c.background}]}>Report a suspicious case</Text>
      </Pressable>
    </ScrollView>
  </SafeAreaView>
}
const styles=StyleSheet.create({
  safe:{flex:1},
  header:{minHeight:62,paddingHorizontal:spacing.lg,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},
  icon:{width:40,height:40,alignItems:"center",justifyContent:"center"},
  headerTitle:{fontSize:17,fontWeight:"800"},
  body:{paddingHorizontal:spacing.lg,paddingBottom:40},
  title:{fontSize:30,fontWeight:"800",letterSpacing:-1,marginTop:18,marginBottom:18},
  h:{fontSize:16,fontWeight:"800",marginTop:20,marginBottom:6},
  p:{fontSize:14,lineHeight:22},
  button:{height:52,borderRadius:26,alignItems:"center",justifyContent:"center",marginTop:28},
  buttonText:{fontSize:14,fontWeight:"800"}
});