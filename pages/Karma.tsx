import React from 'react';
import { Helmet } from 'react-helmet-async';
import KarmaDashboard from '../components/KarmaDashboard';

const Karma: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>$KARMA Staking - Dogepump</title>
        <meta
          name="description"
          content="Stake $KARMA tokens to earn dynamic rewards based on market conditions. Early adopters get bonus multipliers!"
        />
        <meta property="og:title" content="$KARMA Staking - Dogepump" />
        <meta
          property="og:description"
          content="Stake $KARMA tokens to earn dynamic rewards based on market conditions."
        />
        <meta property="og:type" content="website" />
      </Helmet>
      <KarmaDashboard />
    </>
  );
};

export default Karma;
