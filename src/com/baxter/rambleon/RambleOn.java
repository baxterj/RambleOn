package com.baxter.rambleon;

import android.os.Bundle;
import android.app.Activity;
import android.view.Menu;
import org.apache.cordova.*;

public class RambleOn extends DroidGap {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);  
        super.loadUrl("file:///android_asset/www/login.html"); 
    }                                                        
      
    @Override
    public boolean onCreateOptionsMenu(Menu menu) {  
        getMenuInflater().inflate(R.menu.activity_ramble_on, menu);
        return true;
    }     
} 
                                      