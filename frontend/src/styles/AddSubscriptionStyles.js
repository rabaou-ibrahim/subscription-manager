import { StyleSheet } from 'react-native';

const AddSubscriptionStyles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#000' },
  formContainer: { paddingHorizontal:20, paddingTop:16 },
  label: { color:'#B7FF27', fontSize:13, marginBottom:6, fontWeight:'600' },
  input: {
    backgroundColor:'#111',
    borderRadius:12,
    paddingHorizontal:14,
    paddingVertical:12,
    marginBottom:14,
    color:'#eee',
    borderWidth:1,
    borderColor:'#262626',
  },
  inputWithIcon: {
    flexDirection:'row',
    alignItems:'center',
    backgroundColor:'#111',
    borderRadius:12,
    borderWidth:1,
    borderColor:'#262626',
    marginBottom:14,
  },
  button: {
    backgroundColor:'#B7FF27',
    borderRadius:12,
    paddingVertical:14,
    alignItems:'center',
    marginTop:8,
  },
  buttonText: { color:'#000', fontWeight:'800', letterSpacing:0.5 },
  panel: {
  width:'100%',
  maxWidth: 520,
  maxHeight: '80%',   // <= empêche la modal de s’étirer inutilement
  backgroundColor:'#0f0f0f',
  borderRadius:14,
  padding:14,
  borderWidth:1,
  borderColor:'#262626'
},
alert: {
  flexDirection: 'row',
  alignItems: 'center',
  padding: 10,
  borderRadius: 12,
  borderWidth: 1,
  marginBottom: 12,
},
alertError:   { backgroundColor: '#2a1215', borderColor: '#ff6b6b' },
alertSuccess: { backgroundColor: '#172a18', borderColor: '#72CE1D' },
alertText:    { color: '#eee', flexShrink: 1 },

});

export default AddSubscriptionStyles;
