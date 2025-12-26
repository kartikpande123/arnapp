import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import Dashboard from './components/UserDashboard';
import Help from "./components/Help"
import AboutUs from "./components/AboutUs"
import Notifications from "./components/Notification"
import UpcomingExams from './components/UpcomingExam';
import ExamKeyAnswer from './components/ExamKeyAnswer';
import TutorialDashboard from "./components/TutorialDashboard";
import TermsAndConditions from "./components/TermsAndCondition";
import PrivacyPolicy from "./components/PrivacyPolicy";
import CancellationPolicy from "./components/CancellationPolicy";
import ExamForm from "./components/ExamForm";
import PaymentGateway from "./components/PaymentGateway";
import DownloadHallTicket from "./components/DownloadHallTicket";
import UserSyllabus from "./components/UserSyllabus";
import CheckAnswers from "./components/CheckAnswers";
import ExamResults from "./components/ExamResults";
import FindWinner from "./components/FindWinner";
import ExamEntry from "./components/ExamEntry";
import Rewards from "./components/Rewards";
import PracticeTestDashboard from './components/PracticeTestDashboard';
import PracticeTestPurchase from "./components/PracticeTestPurchase";
import PracticeExamEntry from './components/PracticeExamEntry';
import PracticeMainExam from "./components/PracticeMainExam";
import PdfSyllabusDashboard from "./components/PdfSyllabusDashboard";
import PdfSyllabusPurchase from "./components/PdfSyllabusPurchase";
import PdfSyllabusEntry from "./components/PdfSyllabusEntry";
import SecurePdfViewer from "./components/SecurePdfViewer";
import VideoSyllabusDashboard from "./components/VideoSyllabusDashboard";
import VideoSyllabusEntry from "./components/VideoSyllabusEntry";
import VideoSyllabusPurchase from "./components/VideoSyllabusPurchase";
import SuperUserDashboard from "./components/SuperUserDashboard";
import MainExam from "./components/MainExam";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}
        initialRouteName="Dashboard">
          <Stack.Screen name="Dashboard" component={Dashboard} />
          <Stack.Screen name="Help" component={Help} />
          <Stack.Screen name="AboutUs" component={AboutUs} />
          <Stack.Screen name="Notifications" component={Notifications} />
          <Stack.Screen name="UpcomingExams" component={UpcomingExams} />
          <Stack.Screen name="ExamKeyAnswer" component={ExamKeyAnswer} />
          <Stack.Screen name="TutorialDashboard" component={TutorialDashboard} />
          <Stack.Screen name="TermsAndConditions" component={TermsAndConditions} />
          <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicy} />
          <Stack.Screen name="CancellationPolicy" component={CancellationPolicy} />
          <Stack.Screen name="ExamForm" component={ExamForm} />
          <Stack.Screen name="PaymentGateway" component={PaymentGateway} />
          <Stack.Screen name="DownloadHallTicket" component={DownloadHallTicket} />
          <Stack.Screen name="UserSyllabus" component={UserSyllabus} />
          <Stack.Screen name="CheckAnswers" component={CheckAnswers} />
          <Stack.Screen name="ExamResults" component={ExamResults} />
          <Stack.Screen name="FindWinner" component={FindWinner} />
          <Stack.Screen name="ExamEntry" component={ExamEntry} />
          <Stack.Screen name="Rewards" component={Rewards} />
          <Stack.Screen name="PracticeTestDashboard" component={PracticeTestDashboard} />
          <Stack.Screen name="PracticeTestPurchase" component={PracticeTestPurchase} />
          <Stack.Screen name="PracticeExamEntry" component={PracticeExamEntry} />
          <Stack.Screen name="PracticeMainExam" component={PracticeMainExam} />
          <Stack.Screen name="PdfSyllabusDashboard" component={PdfSyllabusDashboard} />
          <Stack.Screen name="PdfSyllabusPurchase" component={PdfSyllabusPurchase} />
          <Stack.Screen name="PdfSyllabusEntry" component={PdfSyllabusEntry} />
          <Stack.Screen name="SecurePdfViewer" component={SecurePdfViewer} />
          <Stack.Screen name="VideoSyllabusDashboard" component={VideoSyllabusDashboard} />
          <Stack.Screen name="VideoSyllabusEntry" component={VideoSyllabusEntry} />
          <Stack.Screen name="VideoSyllabusPurchase" component={VideoSyllabusPurchase} />
          <Stack.Screen name="SuperUserDashboard" component={SuperUserDashboard} />
          <Stack.Screen name="MainExam" component={MainExam} />
        </Stack.Navigator>
      </NavigationContainer>
      <Toast />
    </>
  );
}