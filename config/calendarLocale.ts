import { LocaleConfig } from 'react-native-calendars';

LocaleConfig.locales['sv'] = {
  monthNames: [
    'januari','februari','mars','april','maj','juni',
    'juli','augusti','september','oktober','november','december'
  ],
  monthNamesShort: [
    'jan','feb','mar','apr','maj','jun',
    'jul','aug','sep','okt','nov','dec'
  ],
  dayNames: [
    'söndag','måndag','tisdag','onsdag','torsdag','fredag','lördag'
  ],
  dayNamesShort: ['sön','mån','tis','ons','tor','fre','lör'],
  today: 'Idag',
};

LocaleConfig.defaultLocale = 'sv';
