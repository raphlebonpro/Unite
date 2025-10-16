import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const sections = [
  {
    title: '1. Éditeur de l’application',
    content: `L’application Unite est éditée par la micro-entreprise Unite, immatriculée en France.

Raison sociale : Raphaël LEBON
Forme juridique : Micro-entreprise (entrepreneur individuelle)  
Responsable de publication : Raphaël LEBON
SIREN : 989852413
E-mail : contact@uniteapp.fr`
  },
  {
    title: '2. Hébergement',
    content: `L’application et les données utilisateurs sont hébergées par :

Supabase (hébergement principal)  
Google Cloud Platform – Région Europe West (Belgique)  
Site : https://supabase.com  
Adresse : Google Cloud EMEA, Gordon House, Barrow Street, Dublin 4, Irlande`
  },
  {
    title: '3. Contact',
    content: `Pour toute question, demande ou réclamation relative à l’application, vous pouvez écrire à :  
📧 contact@uniteapp.fr`
  },
  {
    title: '4. Propriété intellectuelle',
    content: `L’ensemble du contenu de l’application Unite (nom, logo, design, code, textes, images, structure) est la propriété exclusive de la micro-entreprise Unite, sauf mention contraire.

Toute reproduction, distribution, modification ou exploitation sans autorisation écrite est strictement interdite.`
  },
  {
    title: '5. Responsabilité',
    content: `Unite met tout en œuvre pour garantir la fiabilité des informations diffusées, mais ne saurait être tenue responsable :
- des erreurs, omissions ou inexactitudes ;
- d’une interruption temporaire du service (maintenance, mise à jour, force majeure) ;
- des dommages directs ou indirects liés à l’utilisation de l’application.`
  },
  {
    title: '6. Données personnelles',
    content: `Les traitements de données effectués par Unite sont conformes au Règlement Général sur la Protection des Données (RGPD) et à la loi française Informatique et Libertés.

Pour en savoir plus, consultez la Politique de Confidentialité intégrée à l’application.`
  },
  {
    title: '7. Droit applicable',
    content: `Les présentes mentions légales sont régies par le droit français.  
En cas de litige, compétence exclusive des tribunaux français.`
  },
];

const MentionsLegalesScreen = () => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      <Text style={styles.header}>Mentions Légales</Text>
      <Text style={styles.subHeader}>Dernière mise à jour : Octobre 2025</Text>
      {sections.map((section, idx) => (
        <View style={styles.box} key={idx}>
          <Text style={styles.title}>{section.title}</Text>
          <Text style={styles.text}>{section.content}</Text>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { backgroundColor: '#f6f7fb', flex: 1 },
  contentContainer: { padding: wp('6%'), paddingBottom: hp('6%') },
  header: {
    fontSize: wp('6.3%'),
    fontWeight: 'bold',
    alignSelf: 'center',
    color: '#1a2343',
    marginTop: hp('1.2%'),
    marginBottom: hp('0.5%'),
  },
  subHeader: {
    fontSize: wp('4.2%'),
    color: '#5e6b87',
    alignSelf: 'center',
    marginBottom: hp('2%'),
  },
  box: {
    backgroundColor: '#fff',
    borderRadius: wp('4%'),
    padding: wp('4.8%'),
    marginBottom: hp('2%'),
    borderColor: '#e4e8f1',
    borderWidth: 0.5,
  },
  title: { fontWeight: 'bold', fontSize: wp('4.6%'), color: '#1a2343', marginBottom: hp('1%') },
  text: { fontSize: wp('4.1%'), color: '#313b52', lineHeight: hp('2.6%') },
});

export default MentionsLegalesScreen;
