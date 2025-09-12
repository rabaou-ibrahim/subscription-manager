import { StyleSheet } from 'react-native';
import CustomSubscriptionScreen from '../components/screens/CustomSubscriptionScreen';

const PURPLE = '#9B51E0';      // Violet du bouton
const BORDER_VIOLET = '#C8B6E2'; 
const BACKGROUND_DARK = '#1A1A1A';

const CustomSubscriptionStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // Fond noir
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 5,
  },
  backButton: {
    padding: 5,
  },

  formContainer: {
    marginHorizontal: 20,
    marginTop: 20,
  },
  label: {
    color: '#72CE1D', // Vert
    fontSize: 16,
    marginBottom: 5,
  },
  input: {
    borderWidth: 2,
    borderColor: BORDER_VIOLET,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 15,
    color: '#fff',
    marginBottom: 20,
  },
  // Pour les champs “Cycle”, “Started on”, etc. (avec chevron)
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: BACKGROUND_DARK,
    borderColor: BORDER_VIOLET,
    borderWidth: 2,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  valueText: {
    color: '#fff',
    fontSize: 16,
  },

  button: {
    alignSelf: 'center',
    backgroundColor: PURPLE,
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CustomSubscriptionStyles;
