import { StyleSheet } from 'react-native';

// Quelques couleurs issues des précédentes maquettes
const GREEN = '#72CE1D';
const PURPLE = '#9B51E0';
const BORDER_VIOLET = '#C8B6E2';

const ActiveSubscriptionStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // Fond noir
  },
  // Header
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

  // Carte de l’abonnement
  cardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 30,
    padding: 15,
    borderWidth: 2,
    borderColor: BORDER_VIOLET,
    borderRadius: 10,
    backgroundColor: '#1A1A1A', // gris très foncé ou noir
  },
  iconStyle: {
    width: 50,
    height: 50,
    marginRight: 15,
    resizeMode: 'contain',
  },
  infoContainer: {
    flex: 1,
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  price: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 3,
  },
  cycle: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.7, // pour un léger contraste
  },
  paymentDue: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.8,
  },
  highlight: {
    color: GREEN, // pour mettre en valeur le nombre de jours
    fontWeight: 'bold',
  },

  // Conteneur des boutons
  buttonsContainer: {
    position: 'absolute',
    bottom: 30,
    width: '100%',
    paddingHorizontal: 20,
  },
  changePaymentButton: {
    backgroundColor: PURPLE,
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 15,
  },
  changePaymentText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: GREEN,
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#000', // texte noir sur fond vert
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ActiveSubscriptionStyles;